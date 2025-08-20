// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/Campaign.sol";
import "../contracts/privacy/PrivacyManager.sol";
import "../contracts/privacy/EERC20Token.sol";
import "../contracts/privacy/UserRegistrar.sol";
import "../contracts/privacy/EncryptedBalanceManager.sol";

contract CampaignIntegrationTest is Test {
    Campaign public campaign;
    PrivacyManager public privacyManager;
    EERC20Token public eerc20Token;
    UserRegistrar public userRegistrar;
    EncryptedBalanceManager public balanceManager;

    address public creator = address(0x1);
    address public donor1 = address(0x2);
    address public donor2 = address(0x3);

    string public constant CAMPAIGN_TITLE = "Integration Test Campaign";
    string public constant CAMPAIGN_DESCRIPTION =
        "Testing donation and withdrawal flows";
    uint256 public constant DEADLINE = 1735689600; // Future timestamp
    bytes public encryptedGoal =
        hex"1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

    // 64-byte public keys (minimum required length)
    bytes public creatorPublicKey =
        hex"fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321";
    bytes public donor1PublicKey =
        hex"abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
    bytes public donor2PublicKey =
        hex"11111111111111112222222222222222333333333333333344444444444444445555555555555555666666666666666677777777777777778888888888888888";

    function setUp() public {
        // Deploy infrastructure contracts
        userRegistrar = new UserRegistrar();
        balanceManager = new EncryptedBalanceManager(address(userRegistrar));
        privacyManager = new PrivacyManager(
            address(userRegistrar),
            address(balanceManager)
        );

        // Deploy eERC20 token
        bytes
            memory encryptedTotalSupply = hex"ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
        eerc20Token = new EERC20Token(
            "Test Token",
            "TEST",
            18,
            encryptedTotalSupply,
            address(userRegistrar),
            address(balanceManager)
        );

        // Deploy campaign contract
        campaign = new Campaign();

        // Initialize campaign
        vm.prank(creator);
        campaign.initialize(
            creator,
            CAMPAIGN_TITLE,
            CAMPAIGN_DESCRIPTION,
            encryptedGoal,
            DEADLINE,
            address(privacyManager)
        );

        // Set eERC20 token
        campaign.setEERC20Token(address(eerc20Token));

        // Authorize campaign in privacy manager
        privacyManager.authorizeCampaign(address(campaign));

        // Register users
        vm.prank(creator);
        privacyManager.registerUser(creatorPublicKey);

        vm.prank(donor1);
        privacyManager.registerUser(donor1PublicKey);

        vm.prank(donor2);
        privacyManager.registerUser(donor2PublicKey);
    }

    function testDonationFlow() public {
        bytes
            memory donationAmount = hex"1111111111111111111111111111111111111111111111111111111111111111";
        bytes
            memory proof = hex"abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

        // Get initial campaign balance
        bytes memory initialBalance = campaign.getEncryptedBalance();

        // Mock the eERC20 transferFrom to return true
        vm.mockCall(
            address(eerc20Token),
            abi.encodeWithSelector(
                IEERC20.transferFrom.selector,
                donor1,
                address(campaign),
                donationAmount,
                proof
            ),
            abi.encode(true)
        );

        // Make donation
        vm.prank(donor1);
        campaign.donate(donationAmount, proof);

        // Verify balance was updated (should be different from initial)
        bytes memory newBalance = campaign.getEncryptedBalance();
        assertTrue(keccak256(newBalance) != keccak256(initialBalance));
    }

    function testWithdrawalFlow() public {
        bytes
            memory proof = hex"fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321";

        // First, simulate that campaign has some funds
        bytes
            memory donationAmount = hex"2222222222222222222222222222222222222222222222222222222222222222";
        bytes
            memory donationProof = hex"1111111111111111111111111111111111111111111111111111111111111111";

        // Mock donation
        vm.mockCall(
            address(eerc20Token),
            abi.encodeWithSelector(
                IEERC20.transferFrom.selector,
                donor1,
                address(campaign),
                donationAmount,
                donationProof
            ),
            abi.encode(true)
        );

        vm.prank(donor1);
        campaign.donate(donationAmount, donationProof);

        // Get campaign balance before withdrawal
        bytes memory balanceBeforeWithdrawal = campaign.getEncryptedBalance();

        // Mock the eERC20 transfer for withdrawal
        vm.mockCall(
            address(eerc20Token),
            abi.encodeWithSelector(
                IEERC20.transfer.selector,
                creator,
                balanceBeforeWithdrawal,
                proof
            ),
            abi.encode(true)
        );

        // Withdraw funds
        vm.prank(creator);
        campaign.withdraw(proof);

        // Verify balance was reset to zero
        bytes memory balanceAfterWithdrawal = campaign.getEncryptedBalance();
        bytes memory zeroBalance = privacyManager.generateZeroAmount();
        assertEq(keccak256(balanceAfterWithdrawal), keccak256(zeroBalance));
    }

    function testPartialWithdrawal() public {
        bytes
            memory withdrawalAmount = hex"1111111111111111111111111111111111111111111111111111111111111111";
        bytes
            memory proof = hex"fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321";

        // First, simulate that campaign has some funds
        bytes
            memory donationAmount = hex"2222222222222222222222222222222222222222222222222222222222222222";
        bytes
            memory donationProof = hex"1111111111111111111111111111111111111111111111111111111111111111";

        // Mock donation
        vm.mockCall(
            address(eerc20Token),
            abi.encodeWithSelector(
                IEERC20.transferFrom.selector,
                donor1,
                address(campaign),
                donationAmount,
                donationProof
            ),
            abi.encode(true)
        );

        vm.prank(donor1);
        campaign.donate(donationAmount, donationProof);

        // Get campaign balance before withdrawal
        bytes memory balanceBeforeWithdrawal = campaign.getEncryptedBalance();

        // Mock the eERC20 transfer for partial withdrawal
        vm.mockCall(
            address(eerc20Token),
            abi.encodeWithSelector(
                IEERC20.transfer.selector,
                creator,
                withdrawalAmount,
                proof
            ),
            abi.encode(true)
        );

        // Withdraw partial amount
        vm.prank(creator);
        campaign.withdrawAmount(withdrawalAmount, proof);

        // Verify balance was updated (should be different from before)
        bytes memory balanceAfterWithdrawal = campaign.getEncryptedBalance();
        assertTrue(
            keccak256(balanceAfterWithdrawal) !=
                keccak256(balanceBeforeWithdrawal)
        );
    }

    function testMultipleDonations() public {
        bytes
            memory donation1Amount = hex"1111111111111111111111111111111111111111111111111111111111111111";
        bytes
            memory donation2Amount = hex"2222222222222222222222222222222222222222222222222222222222222222";
        bytes
            memory proof1 = hex"abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
        bytes
            memory proof2 = hex"fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321";

        // Get initial balance
        bytes memory initialBalance = campaign.getEncryptedBalance();

        // Mock first donation
        vm.mockCall(
            address(eerc20Token),
            abi.encodeWithSelector(
                IEERC20.transferFrom.selector,
                donor1,
                address(campaign),
                donation1Amount,
                proof1
            ),
            abi.encode(true)
        );

        vm.prank(donor1);
        campaign.donate(donation1Amount, proof1);

        bytes memory balanceAfterFirst = campaign.getEncryptedBalance();

        // Mock second donation
        vm.mockCall(
            address(eerc20Token),
            abi.encodeWithSelector(
                IEERC20.transferFrom.selector,
                donor2,
                address(campaign),
                donation2Amount,
                proof2
            ),
            abi.encode(true)
        );

        vm.prank(donor2);
        campaign.donate(donation2Amount, proof2);

        bytes memory balanceAfterSecond = campaign.getEncryptedBalance();

        // Verify balances changed with each donation
        assertTrue(keccak256(balanceAfterFirst) != keccak256(initialBalance));
        assertTrue(
            keccak256(balanceAfterSecond) != keccak256(balanceAfterFirst)
        );
    }

    function testRevertWhenDonationToInactiveCampaign() public {
        bytes
            memory donationAmount = hex"1111111111111111111111111111111111111111111111111111111111111111";
        bytes
            memory proof = hex"abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

        // Deactivate campaign
        vm.prank(creator);
        campaign.updateStatus();

        // Try to donate to inactive campaign (should fail)
        vm.prank(donor1);
        vm.expectRevert("Campaign is not active");
        campaign.donate(donationAmount, proof);
    }

    function testRevertWhenWithdrawalByNonCreator() public {
        bytes
            memory proof = hex"abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

        // Try to withdraw as non-creator (should fail)
        vm.prank(donor1);
        vm.expectRevert("Only creator can call this function");
        campaign.withdraw(proof);
    }

    function testRevertWhenDonationWithoutRegistration() public {
        bytes
            memory donationAmount = hex"1111111111111111111111111111111111111111111111111111111111111111";
        bytes
            memory proof = hex"abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

        address unregisteredUser = address(0x999);

        // Try to donate without registration (should fail)
        vm.prank(unregisteredUser);
        vm.expectRevert("Donor not registered");
        campaign.donate(donationAmount, proof);
    }
}
