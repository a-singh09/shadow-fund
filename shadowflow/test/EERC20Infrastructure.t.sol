// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../contracts/privacy/UserRegistrar.sol";
import "../contracts/privacy/EncryptedBalanceManager.sol";
import "../contracts/privacy/EERC20Token.sol";
import "../contracts/libraries/EERC20Utils.sol";

/**
 * @title EERC20InfrastructureTest
 * @dev Test suite for eERC20 infrastructure components
 */
contract EERC20InfrastructureTest is Test {
    UserRegistrar public userRegistrar;
    EncryptedBalanceManager public balanceManager;
    EERC20Token public eERC20Token;

    address public owner;
    address public user1;
    address public user2;
    address public user3;

    // Test configuration
    string constant TOKEN_NAME = "Test ShadowFlow Token";
    string constant TOKEN_SYMBOL = "TSFT";
    uint8 constant DECIMALS = 18;
    uint256 constant INITIAL_SUPPLY = 1000000 * 10 ** 18;

    event UserRegistered(address indexed user, bytes publicKey);
    event Transfer(
        address indexed from,
        address indexed to,
        bytes encryptedAmount
    );

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        user3 = address(0x3);

        // Deploy contracts
        userRegistrar = new UserRegistrar();
        balanceManager = new EncryptedBalanceManager(address(userRegistrar));

        bytes memory encryptedTotalSupply = EERC20Utils
            .generateTestEncryptedAmount(INITIAL_SUPPLY, owner, 1);

        eERC20Token = new EERC20Token(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            DECIMALS,
            encryptedTotalSupply,
            address(userRegistrar),
            address(balanceManager)
        );

        // Authorize eERC20Token in balance manager
        balanceManager.authorizeContract(address(eERC20Token));
    }

    function testUserRegistrarDeployment() public {
        assertEq(userRegistrar.getTotalUsers(), 0);
        assertTrue(address(userRegistrar) != address(0));
    }

    function testBalanceManagerDeployment() public {
        assertTrue(address(balanceManager) != address(0));
        assertEq(
            address(balanceManager.userRegistrar()),
            address(userRegistrar)
        );
    }

    function testEERC20TokenDeployment() public {
        assertEq(eERC20Token.name(), TOKEN_NAME);
        assertEq(eERC20Token.symbol(), TOKEN_SYMBOL);
        assertEq(eERC20Token.decimals(), DECIMALS);
        assertTrue(eERC20Token.totalSupply().length > 0);
    }

    function testUserRegistration() public {
        bytes memory publicKey = EERC20Utils.generateTestPublicKey(user1, 1);

        vm.prank(user1);
        userRegistrar.registerUser(publicKey);

        assertTrue(userRegistrar.isUserRegistered(user1));
        assertEq(userRegistrar.getTotalUsers(), 1);

        IUserRegistrar.UserProfile memory profile = userRegistrar
            .getUserProfile(user1);
        assertTrue(profile.isRegistered);
        assertEq(profile.publicKey, publicKey);
    }

    function testUserRegistrationThroughToken() public {
        bytes memory publicKey = EERC20Utils.generateTestPublicKey(user1, 1);

        vm.prank(user1);
        eERC20Token.registerUser(publicKey);

        assertTrue(eERC20Token.isUserRegistered(user1));
        assertTrue(userRegistrar.isUserRegistered(user1));
    }

    function testMultipleUserRegistration() public {
        // Register multiple users
        for (uint256 i = 1; i <= 3; i++) {
            address user = address(uint160(i));
            bytes memory publicKey = EERC20Utils.generateTestPublicKey(user, i);

            vm.prank(user);
            userRegistrar.registerUser(publicKey);

            assertTrue(userRegistrar.isUserRegistered(user));
        }

        assertEq(userRegistrar.getTotalUsers(), 3);
    }

    function testEncryptedBalanceOperations() public {
        // Register user first
        bytes memory publicKey = EERC20Utils.generateTestPublicKey(user1, 1);
        vm.prank(user1);
        userRegistrar.registerUser(publicKey);

        // Test encrypted balance operations
        bytes memory encryptedAmount = EERC20Utils.generateTestEncryptedAmount(
            100 * 10 ** 18,
            user1,
            1
        );
        bytes memory proof = EERC20Utils.generateTestProof(
            "balance",
            user1,
            100 * 10 ** 18,
            1
        );

        // Set initial balance
        balanceManager.setEncryptedBalance(user1, encryptedAmount, proof);

        bytes memory retrievedBalance = balanceManager.getEncryptedBalance(
            user1
        );
        assertEq(retrievedBalance, encryptedAmount);
    }

    function testHomomorphicOperations() public {
        bytes memory amount1 = EERC20Utils.generateTestEncryptedAmount(
            100,
            user1,
            1
        );
        bytes memory amount2 = EERC20Utils.generateTestEncryptedAmount(
            50,
            user1,
            2
        );

        bytes memory sum = balanceManager.addEncryptedAmounts(amount1, amount2);
        assertTrue(sum.length > 0);

        bytes memory difference = balanceManager.subtractEncryptedAmounts(
            amount1,
            amount2
        );
        assertTrue(difference.length > 0);
    }

    function testTokenMinting() public {
        // Register user
        bytes memory publicKey = EERC20Utils.generateTestPublicKey(user1, 1);
        vm.prank(user1);
        userRegistrar.registerUser(publicKey);

        // Mint tokens
        bytes memory encryptedAmount = EERC20Utils.generateTestEncryptedAmount(
            1000 * 10 ** 18,
            user1,
            1
        );
        bytes memory proof = EERC20Utils.generateTestProof(
            "mint",
            user1,
            1000 * 10 ** 18,
            1
        );

        vm.expectEmit(true, true, false, true);
        emit Transfer(address(0), user1, encryptedAmount);
        eERC20Token.mint(user1, encryptedAmount, proof);

        bytes memory balance = eERC20Token.balanceOf(user1);
        assertTrue(balance.length > 0);
    }

    function testTokenTransfer() public {
        // Register users
        bytes memory publicKey1 = EERC20Utils.generateTestPublicKey(user1, 1);
        bytes memory publicKey2 = EERC20Utils.generateTestPublicKey(user2, 2);

        vm.prank(user1);
        userRegistrar.registerUser(publicKey1);
        vm.prank(user2);
        userRegistrar.registerUser(publicKey2);

        // Mint tokens to user1
        bytes memory mintAmount = EERC20Utils.generateTestEncryptedAmount(
            1000 * 10 ** 18,
            user1,
            1
        );
        bytes memory mintProof = EERC20Utils.generateTestProof(
            "mint",
            user1,
            1000 * 10 ** 18,
            1
        );
        eERC20Token.mint(user1, mintAmount, mintProof);

        // Transfer from user1 to user2
        bytes memory transferAmount = EERC20Utils.generateTestEncryptedAmount(
            100 * 10 ** 18,
            user1,
            2
        );
        bytes memory transferProof = EERC20Utils.generateTestProof(
            "transfer",
            user1,
            100 * 10 ** 18,
            2
        );

        vm.prank(user1);
        vm.expectEmit(true, true, false, true);
        emit Transfer(user1, user2, transferAmount);
        bool success = eERC20Token.transfer(
            user2,
            transferAmount,
            transferProof
        );

        assertTrue(success);

        // Check balances exist (we can't verify exact amounts due to encryption)
        bytes memory user2Balance = eERC20Token.balanceOf(user2);
        assertTrue(user2Balance.length > 0);
    }

    function testTokenApproval() public {
        // Register users
        bytes memory publicKey1 = EERC20Utils.generateTestPublicKey(user1, 1);
        bytes memory publicKey2 = EERC20Utils.generateTestPublicKey(user2, 2);

        vm.prank(user1);
        userRegistrar.registerUser(publicKey1);
        vm.prank(user2);
        userRegistrar.registerUser(publicKey2);

        // Approve user2 to spend user1's tokens
        bytes memory approvalAmount = EERC20Utils.generateTestEncryptedAmount(
            500 * 10 ** 18,
            user1,
            1
        );
        bytes memory approvalProof = EERC20Utils.generateTestProof(
            "approve",
            user1,
            500 * 10 ** 18,
            1
        );

        vm.prank(user1);
        bool success = eERC20Token.approve(
            user2,
            approvalAmount,
            approvalProof
        );

        assertTrue(success);

        bytes memory allowance = eERC20Token.allowance(user1, user2);
        assertEq(allowance, approvalAmount);
    }

    function testInvalidOperations() public {
        // Test registration with invalid public key
        bytes memory invalidKey = new bytes(10); // Too short

        vm.prank(user1);
        vm.expectRevert("Invalid public key format");
        userRegistrar.registerUser(invalidKey);

        // Test operations on unregistered user
        vm.expectRevert("User not registered");
        balanceManager.getEncryptedBalance(user1);
    }

    function testUtilityFunctions() public {
        // Test utility function generation
        bytes memory publicKey = EERC20Utils.generateTestPublicKey(user1, 1);
        assertTrue(publicKey.length == 64);

        bytes memory encryptedAmount = EERC20Utils.generateTestEncryptedAmount(
            100,
            user1,
            1
        );
        assertTrue(EERC20Utils.isValidEncryptedFormat(encryptedAmount));

        bytes memory proof = EERC20Utils.generateTestProof(
            "test",
            user1,
            100,
            1
        );
        assertTrue(EERC20Utils.isValidProofFormat(proof));

        // Test homomorphic operations
        bytes memory amount1 = EERC20Utils.generateTestEncryptedAmount(
            100,
            user1,
            1
        );
        bytes memory amount2 = EERC20Utils.generateTestEncryptedAmount(
            50,
            user1,
            2
        );
        bytes memory sum = EERC20Utils.testHomomorphicAdd(amount1, amount2);
        assertTrue(sum.length > 0);
    }

    function testCompleteWorkflow() public {
        console.log("Testing complete eERC20 workflow...");

        // Use different users to avoid conflicts
        address workflowUser1 = address(0x1001);
        address workflowUser2 = address(0x1002);

        // 1. Register users
        bytes memory publicKey1 = EERC20Utils.generateTestPublicKey(
            workflowUser1,
            1
        );
        bytes memory publicKey2 = EERC20Utils.generateTestPublicKey(
            workflowUser2,
            2
        );

        vm.prank(workflowUser1);
        eERC20Token.registerUser(publicKey1);
        vm.prank(workflowUser2);
        eERC20Token.registerUser(publicKey2);

        // 2. Mint initial tokens
        bytes memory mintAmount = EERC20Utils.generateTestEncryptedAmount(
            10000 * 10 ** 18,
            workflowUser1,
            1
        );
        bytes memory mintProof = EERC20Utils.generateTestProof(
            "mint",
            workflowUser1,
            10000 * 10 ** 18,
            1
        );
        eERC20Token.mint(workflowUser1, mintAmount, mintProof);

        // 3. Transfer tokens
        bytes memory transferAmount = EERC20Utils.generateTestEncryptedAmount(
            1000 * 10 ** 18,
            workflowUser1,
            2
        );
        bytes memory transferProof = EERC20Utils.generateTestProof(
            "transfer",
            workflowUser1,
            1000 * 10 ** 18,
            2
        );

        vm.prank(workflowUser1);
        eERC20Token.transfer(workflowUser2, transferAmount, transferProof);

        // 4. Verify final state
        assertTrue(eERC20Token.isUserRegistered(workflowUser1));
        assertTrue(eERC20Token.isUserRegistered(workflowUser2));
        assertTrue(eERC20Token.balanceOf(workflowUser1).length > 0);
        assertTrue(eERC20Token.balanceOf(workflowUser2).length > 0);

        console.log("Complete workflow test passed!");
    }
}
