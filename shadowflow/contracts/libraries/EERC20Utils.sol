// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IEERC20.sol";
import "../interfaces/IUserRegistrar.sol";
import "../interfaces/IEncryptedBalanceManager.sol";

/**
 * @title EERC20Utils
 * @dev Utility functions for eERC20 integration and testing
 */
library EERC20Utils {
    /**
     * @dev Generate a test public key for a user
     * @param user The user address
     * @param seed Additional entropy for key generation
     * @return bytes containing the generated public key
     */
    function generateTestPublicKey(
        address user,
        uint256 seed
    ) internal pure returns (bytes memory) {
        bytes32 keyPart1 = keccak256(
            abi.encodePacked("test_public_key_1", user, seed)
        );
        bytes32 keyPart2 = keccak256(
            abi.encodePacked("test_public_key_2", user, seed)
        );
        return abi.encodePacked(keyPart1, keyPart2); // 64 bytes key
    }

    /**
     * @dev Generate encrypted amount for testing
     * @param amount The plaintext amount to encrypt
     * @param user The user address for encryption context
     * @param nonce Additional entropy
     * @return bytes containing encrypted amount
     */
    function generateTestEncryptedAmount(
        uint256 amount,
        address user,
        uint256 nonce
    ) internal pure returns (bytes memory) {
        return
            abi.encodePacked(
                keccak256(abi.encodePacked("encrypted", amount, user, nonce))
            );
    }

    /**
     * @dev Generate test proof for operations
     * @param operation The operation type (e.g., "transfer", "mint", "approve")
     * @param user The user address
     * @param amount The amount involved
     * @param nonce Additional entropy
     * @return bytes containing the proof
     */
    function generateTestProof(
        string memory operation,
        address user,
        uint256 amount,
        uint256 nonce
    ) internal pure returns (bytes memory) {
        bytes32 proofHash = keccak256(
            abi.encodePacked("proof", operation, user, amount, nonce)
        );
        return abi.encodePacked(proofHash);
    }

    /**
     * @dev Validate encrypted amount format
     * @param encryptedAmount The encrypted amount to validate
     * @return bool indicating if the format is valid
     */
    function isValidEncryptedFormat(
        bytes memory encryptedAmount
    ) internal pure returns (bool) {
        return encryptedAmount.length >= 32 && encryptedAmount.length <= 256;
    }

    /**
     * @dev Generate test user profile data
     * @param user The user address
     * @param seed Seed for deterministic generation
     * @return publicKey Generated public key
     * @return encryptedBalance Generated encrypted balance
     * @return proof Generated proof for balance
     */
    function generateTestUserData(
        address user,
        uint256 seed
    )
        internal
        pure
        returns (
            bytes memory publicKey,
            bytes memory encryptedBalance,
            bytes memory proof
        )
    {
        publicKey = generateTestPublicKey(user, seed);
        encryptedBalance = generateTestEncryptedAmount(
            1000 * 10 ** 18,
            user,
            seed
        );
        proof = generateTestProof(
            "initial_balance",
            user,
            1000 * 10 ** 18,
            seed
        );
    }

    /**
     * @dev Create test donation data
     * @param donor The donor address
     * @param amount The donation amount
     * @param nonce Nonce for uniqueness
     * @return encryptedAmount Encrypted donation amount
     * @return proof Proof for the donation
     */
    function generateTestDonation(
        address donor,
        uint256 amount,
        uint256 nonce
    ) internal pure returns (bytes memory encryptedAmount, bytes memory proof) {
        encryptedAmount = generateTestEncryptedAmount(amount, donor, nonce);
        proof = generateTestProof("donate", donor, amount, nonce);
    }

    /**
     * @dev Simulate homomorphic addition for testing
     * @param a First encrypted amount
     * @param b Second encrypted amount
     * @return bytes Result of homomorphic addition
     */
    function testHomomorphicAdd(
        bytes memory a,
        bytes memory b
    ) internal pure returns (bytes memory) {
        require(
            a.length == b.length,
            "Encrypted amounts must have same length"
        );

        bytes memory result = new bytes(a.length);
        for (uint256 i = 0; i < a.length; i++) {
            result[i] = bytes1(uint8(a[i]) ^ uint8(b[i])); // XOR as placeholder
        }
        return result;
    }

    /**
     * @dev Generate multiple test users with encrypted balances
     * @param count Number of users to generate
     * @return users Array of user addresses
     * @return publicKeys Array of public keys
     * @return encryptedBalances Array of encrypted balances
     */
    function generateTestUsers(
        uint256 count
    )
        internal
        pure
        returns (
            address[] memory users,
            bytes[] memory publicKeys,
            bytes[] memory encryptedBalances
        )
    {
        users = new address[](count);
        publicKeys = new bytes[](count);
        encryptedBalances = new bytes[](count);

        for (uint256 i = 0; i < count; i++) {
            users[i] = address(
                uint160(uint256(keccak256(abi.encodePacked("test_user", i))))
            );
            publicKeys[i] = generateTestPublicKey(users[i], i);
            encryptedBalances[i] = generateTestEncryptedAmount(
                1000 * 10 ** 18,
                users[i],
                i
            );
        }
    }

    /**
     * @dev Validate proof format for testing
     * @param proof The proof to validate
     * @return bool indicating if proof format is valid
     */
    function isValidProofFormat(
        bytes memory proof
    ) internal pure returns (bool) {
        return proof.length >= 32;
    }

    /**
     * @dev Generate test campaign data
     * @param creator The campaign creator
     * @param goalAmount The campaign goal amount
     * @param seed Seed for generation
     * @return encryptedGoal Encrypted goal amount
     * @return proof Proof for goal setting
     */
    function generateTestCampaignData(
        address creator,
        uint256 goalAmount,
        uint256 seed
    ) internal pure returns (bytes memory encryptedGoal, bytes memory proof) {
        encryptedGoal = generateTestEncryptedAmount(goalAmount, creator, seed);
        proof = generateTestProof("create_campaign", creator, goalAmount, seed);
    }

    /**
     * @dev Calculate test encrypted zero amount
     * @return bytes Encrypted representation of zero
     */
    function getTestEncryptedZero() internal pure returns (bytes memory) {
        return new bytes(32); // 32 bytes of zeros
    }

    /**
     * @dev Verify test setup is valid
     * @param userRegistrar The user registrar contract
     * @param balanceManager The balance manager contract
     * @param token The eERC20 token contract
     * @return bool indicating if setup is valid
     */
    function verifyTestSetup(
        address userRegistrar,
        address balanceManager,
        address token
    ) internal pure returns (bool) {
        return
            userRegistrar != address(0) &&
            balanceManager != address(0) &&
            token != address(0);
    }
}
