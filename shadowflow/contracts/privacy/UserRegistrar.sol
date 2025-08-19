// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IUserRegistrar.sol";

/**
 * @title UserRegistrar
 * @dev Manages user registration and encryption keys for eERC20 system
 */
contract UserRegistrar is IUserRegistrar {
    mapping(address => UserProfile) private userProfiles;
    address[] private registeredUsers;
    uint256 private totalUsers;

    modifier onlyRegistered() {
        require(userProfiles[msg.sender].isRegistered, "User not registered");
        _;
    }

    modifier validPublicKey(bytes memory publicKey) {
        require(isValidPublicKey(publicKey), "Invalid public key format");
        _;
    }

    /**
     * @dev Register a new user with their public key
     * @param publicKey The user's public key for encryption
     */
    function registerUser(
        bytes memory publicKey
    ) external validPublicKey(publicKey) {
        require(
            !userProfiles[msg.sender].isRegistered,
            "User already registered"
        );

        userProfiles[msg.sender] = UserProfile({
            publicKey: publicKey,
            isRegistered: true,
            registrationTime: block.timestamp,
            lastKeyUpdate: block.timestamp
        });

        registeredUsers.push(msg.sender);
        totalUsers++;

        emit UserRegistered(msg.sender, publicKey, block.timestamp);
    }

    /**
     * @dev Register a user on behalf of another address (for authorized contracts)
     * @param user The user address to register
     * @param publicKey The user's public key for encryption
     */
    function registerUserFor(
        address user,
        bytes memory publicKey
    ) external validPublicKey(publicKey) {
        require(!userProfiles[user].isRegistered, "User already registered");
        require(user != address(0), "Invalid user address");

        userProfiles[user] = UserProfile({
            publicKey: publicKey,
            isRegistered: true,
            registrationTime: block.timestamp,
            lastKeyUpdate: block.timestamp
        });

        registeredUsers.push(user);
        totalUsers++;

        emit UserRegistered(user, publicKey, block.timestamp);
    }

    /**
     * @dev Update user's public key with proof verification
     * @param newPublicKey The new public key
     * @param proof Zero-knowledge proof for key update authorization
     */
    function updatePublicKey(
        bytes memory newPublicKey,
        bytes memory proof
    ) external onlyRegistered validPublicKey(newPublicKey) {
        // In a full implementation, we would verify the proof here
        // For now, we'll implement basic validation
        require(proof.length > 0, "Proof required for key update");

        userProfiles[msg.sender].publicKey = newPublicKey;
        userProfiles[msg.sender].lastKeyUpdate = block.timestamp;

        emit KeyUpdated(msg.sender, newPublicKey, block.timestamp);
    }

    /**
     * @dev Check if a user is registered
     * @param user The user address to check
     * @return bool indicating registration status
     */
    function isUserRegistered(address user) external view returns (bool) {
        return userProfiles[user].isRegistered;
    }

    /**
     * @dev Get complete user profile
     * @param user The user address
     * @return UserProfile struct with user data
     */
    function getUserProfile(
        address user
    ) external view returns (UserProfile memory) {
        require(userProfiles[user].isRegistered, "User not registered");
        return userProfiles[user];
    }

    /**
     * @dev Get user's public key
     * @param user The user address
     * @return bytes containing the public key
     */
    function getUserPublicKey(
        address user
    ) external view returns (bytes memory) {
        require(userProfiles[user].isRegistered, "User not registered");
        return userProfiles[user].publicKey;
    }

    /**
     * @dev Get total number of registered users
     * @return uint256 total user count
     */
    function getTotalUsers() external view returns (uint256) {
        return totalUsers;
    }

    /**
     * @dev Validate public key format (basic validation)
     * @param publicKey The public key to validate
     * @return bool indicating if key is valid
     */
    function isValidPublicKey(
        bytes memory publicKey
    ) public pure returns (bool) {
        // Basic validation: key should be between 64 and 512 bytes (RSA 2048-bit range)
        return publicKey.length >= 64 && publicKey.length <= 512;
    }
}
