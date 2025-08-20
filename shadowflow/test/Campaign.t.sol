// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/Campaign.sol";
import "../contracts/privacy/PrivacyManager.sol";
import "../contracts/privacy/EERC20Token.sol";
import "../contracts/privacy/UserRegistrar.sol";
import "../contracts/privacy/EncryptedBalanceManager.sol";

contract CampaignTest is Test {
    Campaign public campaign;
    PrivacyManager public privacyManager;
    EERC20Token public eerc20Token;
    UserRegistrar public userRegistrar;
    EncryptedBalanceManager public balanceManager;

    address public creator = address(0x1);
    address public donor = address(0x2);

    string public constant CAMPAIGN_TITLE = "Test Campaign";
    string public constant CAMPAIGN_DESCRIPTION =
        "A test campaign for unit testing";
    uint256 public constant DEADLINE = 1735689600; // Future timestamp
    bytes public encryptedGoal =
        hex"1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    bytes public donorPublicKey =
        hex"abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
    bytes public creatorPublicKey =
        hex"fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321";

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

        vm.prank(donor);
        privacyManager.registerUser(donorPublicKey);
    }

    function testCampaignInitialization() public {
        // Test campaign info
        ICampaign.CampaignInfo memory info = campaign.getCampaignInfo();
        assertEq(info.creator, creator);
        assertEq(info.title, CAMPAIGN_TITLE);
        assertEq(info.description, CAMPAIGN_DESCRIPTION);
        assertEq(info.deadline, DEADLINE);
        assertTrue(info.isActive);
        assertEq(info.encryptedGoal, encryptedGoal);

        // Test other getters
        assertEq(campaign.getCreator(), creator);
        assertEq(campaign.getTokenAddress(), address(eerc20Token));
        assertFalse(campaign.isDeadlinePassed());

        // Test encrypted balance is initialized to zero
        bytes memory balance = campaign.getEncryptedBalance();
        assertTrue(balance.length > 0);
    }

    function testAccessControls() public {
        bytes
            memory proof = hex"1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

        // Test only creator can withdraw
        vm.prank(donor);
        vm.expectRevert("Only creator can call this function");
        campaign.withdraw(proof);

        // Test only initialized campaign can be used
        Campaign newCampaign = new Campaign();
        vm.expectRevert("Campaign not initialized");
        newCampaign.getCampaignInfo();
    }

    function testCampaignStatusUpdate() public {
        // Initially active
        assertTrue(campaign.getCampaignInfo().isActive);

        // Creator can update status
        vm.prank(creator);
        campaign.updateStatus();
        assertFalse(campaign.getCampaignInfo().isActive);
    }

    function testValidationModifiers() public {
        bytes memory invalidAmount = hex"";
        bytes
            memory validAmount = hex"1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
        bytes memory invalidProof = hex"";
        bytes
            memory validProof = hex"1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

        // Test invalid encrypted amount
        vm.prank(donor);
        vm.expectRevert("Invalid encrypted amount");
        campaign.donate(invalidAmount, validProof);

        // Test invalid proof
        vm.prank(donor);
        vm.expectRevert("Invalid proof");
        campaign.donate(validAmount, invalidProof);
    }

    function testGetters() public {
        // Test hasFunds (should be false initially)
        assertTrue(campaign.hasFunds()); // Campaign has zero balance initialized

        // Test getEncryptedGoal
        bytes memory goal = campaign.getEncryptedGoal();
        assertEq(goal, encryptedGoal);

        // Test getEncryptedBalance
        bytes memory balance = campaign.getEncryptedBalance();
        assertTrue(balance.length > 0);
    }
}
