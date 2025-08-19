// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../contracts/privacy/PrivacyManager.sol";
import "../contracts/privacy/UserRegistrar.sol";
import "../contracts/privacy/EncryptedBalanceManager.sol";

contract PrivacyManagerTest is Test {
    PrivacyManager public privacyManager;
    UserRegistrar public userRegistrar;
    EncryptedBalanceManager public balanceManager;

    address public owner;
    address public user1;
    address public user2;
    address public campaign1;
    address public campaign2;

    bytes public validPublicKey1;
    bytes public validPublicKey2;
    bytes public validProof;

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        campaign1 = address(0x101);
        campaign2 = address(0x102);

        // Create valid test data (public keys must be 64-512 bytes)
        validPublicKey1 = new bytes(64);
        validPublicKey2 = new bytes(64);

        // Fill with some test data
        for (uint256 i = 0; i < 64; i++) {
            validPublicKey1[i] = bytes1(uint8(i + 1));
            validPublicKey2[i] = bytes1(uint8(i + 100));
        }

        validProof = abi.encodePacked(keccak256("valid_proof_data"));

        // Deploy contracts
        userRegistrar = new UserRegistrar();
        balanceManager = new EncryptedBalanceManager(address(userRegistrar));
        privacyManager = new PrivacyManager(
            address(userRegistrar),
            address(balanceManager)
        );

        // Authorize privacy manager to use balance manager
        balanceManager.authorizeContract(address(privacyManager));
    }

    function testDeployment() public view {
        assertEq(
            address(privacyManager.userRegistrar()),
            address(userRegistrar)
        );
        assertEq(
            address(privacyManager.balanceManager()),
            address(balanceManager)
        );
    }

    function testUserRegistration() public {
        // Test user registration through privacy manager
        vm.prank(user1);
        privacyManager.registerUser(validPublicKey1);

        assertTrue(privacyManager.isUserRegistered(user1));
        assertEq(privacyManager.getUserPublicKey(user1), validPublicKey1);
    }

    function testUserRegistrationFailsWithInvalidKey() public {
        bytes memory invalidKey = new bytes(10); // Too short

        vm.prank(user1);
        vm.expectRevert("Invalid public key format");
        privacyManager.registerUser(invalidKey);
    }

    function testCampaignAuthorization() public {
        // Test campaign authorization
        privacyManager.authorizeCampaign(campaign1);

        // Test that authorized campaign can initialize balance
        vm.prank(campaign1);
        bytes memory initialBalance = privacyManager.initializeCampaignBalance(
            campaign1
        );
        assertEq(initialBalance.length, 32); // Should return 32-byte zero
    }

    function testUnauthorizedCampaignFails() public {
        vm.prank(campaign1);
        vm.expectRevert("Not authorized campaign");
        privacyManager.initializeCampaignBalance(campaign1);
    }

    function testEncryptAmount() public {
        // Register user first
        vm.prank(user1);
        privacyManager.registerUser(validPublicKey1);

        // Test amount encryption
        uint256 amount = 1000;
        bytes memory encrypted = privacyManager.encryptAmount(amount, user1);
        assertTrue(encrypted.length > 0);
        assertTrue(privacyManager.isValidEncryptedAmount(encrypted));
    }

    function testEncryptAmountFailsForUnregisteredUser() public {
        uint256 amount = 1000;
        vm.expectRevert("User not registered");
        privacyManager.encryptAmount(amount, user1);
    }

    function testGenerateZeroAmount() public view {
        bytes memory zero = privacyManager.generateZeroAmount();
        assertEq(zero.length, 32);

        // Verify it's all zeros
        for (uint256 i = 0; i < zero.length; i++) {
            assertEq(uint8(zero[i]), 0);
        }
    }

    function testDonationProofVerification() public {
        // Register user
        vm.prank(user1);
        privacyManager.registerUser(validPublicKey1);

        // Create encrypted amount
        uint256 amount = 500;
        bytes memory encryptedAmount = privacyManager.encryptAmount(
            amount,
            user1
        );

        // Test donation proof verification
        bool isValid = privacyManager.verifyDonationProof(
            user1,
            campaign1,
            encryptedAmount,
            validProof
        );
        assertTrue(isValid);
    }

    function testDonationProofFailsForUnregisteredUser() public {
        bytes memory encryptedAmount = abi.encodePacked(
            keccak256("fake_amount")
        );

        vm.expectRevert("User not registered");
        privacyManager.verifyDonationProof(
            user1,
            campaign1,
            encryptedAmount,
            validProof
        );
    }

    function testWithdrawalProofVerification() public {
        // Register user
        vm.prank(user1);
        privacyManager.registerUser(validPublicKey1);

        // Create encrypted amount
        uint256 amount = 1000;
        bytes memory encryptedAmount = privacyManager.encryptAmount(
            amount,
            user1
        );

        // Test withdrawal proof verification
        bool isValid = privacyManager.verifyWithdrawalProof(
            user1,
            campaign1,
            encryptedAmount,
            validProof
        );
        assertTrue(isValid);
    }

    function testHomomorphicAddition() public {
        bytes memory amount1 = abi.encodePacked(keccak256("amount1"));
        bytes memory amount2 = abi.encodePacked(keccak256("amount2"));

        bytes memory sum = privacyManager.addEncryptedAmounts(amount1, amount2);
        assertTrue(sum.length > 0);
        assertTrue(privacyManager.isValidEncryptedAmount(sum));
    }

    function testHomomorphicSubtraction() public {
        bytes memory amount1 = abi.encodePacked(keccak256("amount1"));
        bytes memory amount2 = abi.encodePacked(keccak256("amount2"));

        bytes memory difference = privacyManager.subtractEncryptedAmounts(
            amount1,
            amount2
        );
        assertTrue(difference.length > 0);
        assertTrue(privacyManager.isValidEncryptedAmount(difference));
    }

    function testHomomorphicOperationsFailWithInvalidAmounts() public {
        bytes memory validAmount = abi.encodePacked(keccak256("valid_amount"));
        bytes memory invalidAmount = new bytes(10); // Too short

        vm.expectRevert("Invalid first encrypted amount");
        privacyManager.addEncryptedAmounts(invalidAmount, validAmount);

        vm.expectRevert("Invalid second encrypted amount");
        privacyManager.addEncryptedAmounts(validAmount, invalidAmount);
    }

    function testCampaignBalanceUpdate() public {
        // Authorize campaign
        privacyManager.authorizeCampaign(campaign1);

        // Initialize campaign balance
        vm.prank(campaign1);
        bytes memory initialBalance = privacyManager.initializeCampaignBalance(
            campaign1
        );

        // Create donation amount
        bytes memory donationAmount = abi.encodePacked(keccak256("donation"));

        // Update campaign balance
        vm.prank(campaign1);
        bytes memory newBalance = privacyManager.updateCampaignBalance(
            campaign1,
            initialBalance,
            donationAmount,
            validProof
        );

        assertTrue(newBalance.length > 0);
        assertTrue(privacyManager.isValidEncryptedAmount(newBalance));
    }

    function testValidateProofFormat() public view {
        // Valid proof
        assertTrue(privacyManager.validateProofFormat(validProof));

        // Invalid proof - too short
        bytes memory shortProof = new bytes(10);
        assertFalse(privacyManager.validateProofFormat(shortProof));

        // Invalid proof - too long
        bytes memory longProof = new bytes(2000);
        assertFalse(privacyManager.validateProofFormat(longProof));
    }

    function testIsValidEncryptedAmount() public view {
        // Valid amount
        bytes memory validAmount = abi.encodePacked(keccak256("valid_amount"));
        assertTrue(privacyManager.isValidEncryptedAmount(validAmount));

        // Invalid amount - too short
        bytes memory shortAmount = new bytes(10);
        assertFalse(privacyManager.isValidEncryptedAmount(shortAmount));

        // Invalid amount - too long
        bytes memory longAmount = new bytes(300);
        assertFalse(privacyManager.isValidEncryptedAmount(longAmount));
    }

    function testGetEncryptedBalanceForUnregisteredUser() public view {
        bytes memory balance = privacyManager.getEncryptedBalance(user1);
        assertEq(balance.length, 0);
    }

    function testGetEncryptedBalanceForRegisteredUser() public {
        // Register user
        vm.prank(user1);
        privacyManager.registerUser(validPublicKey1);

        bytes memory balance = privacyManager.getEncryptedBalance(user1);
        assertEq(balance.length, 32); // Should return zero balance
    }

    function testCampaignRevocation() public {
        // Authorize campaign
        privacyManager.authorizeCampaign(campaign1);

        // Verify campaign can initialize balance
        vm.prank(campaign1);
        privacyManager.initializeCampaignBalance(campaign1);

        // Revoke campaign
        privacyManager.revokeCampaign(campaign1);

        // Verify campaign can no longer initialize balance
        vm.prank(campaign1);
        vm.expectRevert("Not authorized campaign");
        privacyManager.initializeCampaignBalance(campaign1);
    }

    function testOnlyOwnerCanAuthorizeCampaigns() public {
        vm.prank(user1);
        vm.expectRevert("Only owner can call this function");
        privacyManager.authorizeCampaign(campaign1);
    }

    function testMultipleUserRegistrations() public {
        // Register multiple users
        vm.prank(user1);
        privacyManager.registerUser(validPublicKey1);

        vm.prank(user2);
        privacyManager.registerUser(validPublicKey2);

        // Verify both are registered
        assertTrue(privacyManager.isUserRegistered(user1));
        assertTrue(privacyManager.isUserRegistered(user2));
        assertEq(privacyManager.getUserPublicKey(user1), validPublicKey1);
        assertEq(privacyManager.getUserPublicKey(user2), validPublicKey2);
    }
}
