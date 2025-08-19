// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IEncryptedBalanceManager
 * @dev Interface for managing encrypted balances and homomorphic operations
 */
interface IEncryptedBalanceManager {
    // Events
    event BalanceUpdated(
        address indexed user,
        bytes encryptedBalance,
        uint256 timestamp
    );
    event EncryptedTransfer(
        address indexed from,
        address indexed to,
        bytes encryptedAmount
    );

    // Balance management functions
    function getEncryptedBalance(
        address user
    ) external view returns (bytes memory);

    function setEncryptedBalance(
        address user,
        bytes memory encryptedBalance,
        bytes memory proof
    ) external;

    function addToBalance(
        address user,
        bytes memory encryptedAmount,
        bytes memory proof
    ) external;

    function subtractFromBalance(
        address user,
        bytes memory encryptedAmount,
        bytes memory proof
    ) external;

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

    // Proof verification
    function verifyBalanceProof(
        address user,
        bytes memory encryptedAmount,
        bytes memory proof
    ) external view returns (bool);

    function verifyTransferProof(
        address from,
        address to,
        bytes memory encryptedAmount,
        bytes memory proof
    ) external view returns (bool);

    // Utility functions
    function encryptAmount(
        uint256 amount,
        address user
    ) external view returns (bytes memory);

    function generateZeroAmount() external pure returns (bytes memory);
}
