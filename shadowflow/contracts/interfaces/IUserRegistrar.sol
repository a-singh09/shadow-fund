// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IUserRegistrar
 * @dev Interface for managing user registration and encryption keys
 */
interface IUserRegistrar {
    // Events
    event UserRegistered(
        address indexed user,
        bytes publicKey,
        uint256 timestamp
    );
    event KeyUpdated(
        address indexed user,
        bytes newPublicKey,
        uint256 timestamp
    );

    // Structs
    struct UserProfile {
        bytes publicKey;
        bool isRegistered;
        uint256 registrationTime;
        uint256 lastKeyUpdate;
    }

    // Registration functions
    function registerUser(bytes memory publicKey) external;

    function registerUserFor(address user, bytes memory publicKey) external;

    function updatePublicKey(
        bytes memory newPublicKey,
        bytes memory proof
    ) external;

    function isUserRegistered(address user) external view returns (bool);

    function getUserProfile(
        address user
    ) external view returns (UserProfile memory);

    function getUserPublicKey(
        address user
    ) external view returns (bytes memory);

    // Administrative functions
    function getTotalUsers() external view returns (uint256);

    function isValidPublicKey(
        bytes memory publicKey
    ) external pure returns (bool);
}
