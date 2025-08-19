// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IEERC20
 * @dev Interface for encrypted ERC20 token with privacy features
 */
interface IEERC20 {
    // Events
    event Transfer(
        address indexed from,
        address indexed to,
        bytes encryptedAmount
    );
    event Approval(
        address indexed owner,
        address indexed spender,
        bytes encryptedAmount
    );
    event UserRegistered(address indexed user, bytes publicKey);

    // Standard ERC20-like functions with encryption
    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    function decimals() external view returns (uint8);

    function totalSupply() external view returns (bytes memory);

    // Encrypted balance and allowance functions
    function balanceOf(address account) external view returns (bytes memory);

    function allowance(
        address owner,
        address spender
    ) external view returns (bytes memory);

    // Transfer functions with encrypted amounts
    function transfer(
        address to,
        bytes memory encryptedAmount,
        bytes memory proof
    ) external returns (bool);

    function transferFrom(
        address from,
        address to,
        bytes memory encryptedAmount,
        bytes memory proof
    ) external returns (bool);

    function approve(
        address spender,
        bytes memory encryptedAmount,
        bytes memory proof
    ) external returns (bool);

    // Privacy-specific functions
    function registerUser(bytes memory publicKey) external;

    function isUserRegistered(address user) external view returns (bool);

    function mint(
        address to,
        bytes memory encryptedAmount,
        bytes memory proof
    ) external;
}
