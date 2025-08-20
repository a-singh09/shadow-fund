// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPrivacyManager
 * @dev Interface for privacy operations in ShadowFlow campaign system
 * Provides encryption, proof verification, and homomorphic operations
 */
interface IPrivacyManager {
    // Events
    event UserRegistered(address indexed user, uint256 timestamp);
    event DonationProofVerified(
        address indexed donor,
        address indexed campaign,
        bytes32 proofHash
    );
    event WithdrawalProofVerified(
        address indexed creator,
        address indexed campaign,
        bytes32 proofHash
    );

    // User registration functions
    function registerUser(bytes memory publicKey) external;

    function isUserRegistered(address user) external view returns (bool);

    function getUserPublicKey(
        address user
    ) external view returns (bytes memory);

    // Encryption functions
    function encryptAmount(
        uint256 amount,
        address user
    ) external view returns (bytes memory);

    function generateZeroAmount() external pure returns (bytes memory);

    // Proof verification functions
    function verifyDonationProof(
        address donor,
        address campaign,
        bytes memory encryptedAmount,
        bytes memory proof
    ) external view returns (bool);

    function verifyWithdrawalProof(
        address creator,
        address campaign,
        bytes memory encryptedAmount,
        bytes memory proof
    ) external view returns (bool);

    function verifyBalanceProof(
        address user,
        bytes memory encryptedAmount,
        bytes memory proof
    ) external view returns (bool);

    // Homomorphic operations
    function addEncryptedAmounts(
        bytes memory a,
        bytes memory b
    ) external pure returns (bytes memory);

    function subtractEncryptedAmounts(
        bytes memory a,
        bytes memory b
    ) external pure returns (bytes memory);

    function isValidEncryptedAmount(
        bytes memory encryptedAmount
    ) external pure returns (bool);

    // Campaign-specific functions
    function initializeCampaignBalance(
        address campaign
    ) external returns (bytes memory);

    function updateCampaignBalance(
        address campaign,
        bytes memory currentBalance,
        bytes memory donationAmount,
        bytes memory proof
    ) external returns (bytes memory);

    // Utility functions
    function getEncryptedBalance(
        address user
    ) external view returns (bytes memory);

    function validateProofFormat(
        bytes memory proof
    ) external pure returns (bool);

    // Campaign authorization functions
    function authorizeCampaign(address campaign) external;

    function revokeCampaign(address campaign) external;
}
