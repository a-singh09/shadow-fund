// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../contracts/privacy/UserRegistrar.sol";
import "../contracts/privacy/EncryptedBalanceManager.sol";
import "../contracts/privacy/EERC20Token.sol";

/**
 * @title DeployEERC20
 * @dev Deployment script for eERC20 infrastructure
 */
contract DeployEERC20 is Script {
    // Configuration from eerc20.config.json
    string constant TOKEN_NAME = "ShadowFlow Token";
    string constant TOKEN_SYMBOL = "SFT";
    uint8 constant DECIMALS = 18;
    uint256 constant INITIAL_SUPPLY = 1000000000000000000000000; // 1M tokens with 18 decimals

    UserRegistrar public userRegistrar;
    EncryptedBalanceManager public balanceManager;
    EERC20Token public eERC20Token;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying eERC20 infrastructure...");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Deploy UserRegistrar
        console.log("Deploying UserRegistrar...");
        userRegistrar = new UserRegistrar();
        console.log("UserRegistrar deployed at:", address(userRegistrar));

        // Step 2: Deploy EncryptedBalanceManager
        console.log("Deploying EncryptedBalanceManager...");
        balanceManager = new EncryptedBalanceManager(address(userRegistrar));
        console.log(
            "EncryptedBalanceManager deployed at:",
            address(balanceManager)
        );

        // Step 3: Generate encrypted initial supply (simplified)
        bytes memory encryptedTotalSupply = generateEncryptedSupply(
            INITIAL_SUPPLY
        );

        // Step 4: Deploy eERC20Token
        console.log("Deploying EERC20Token...");
        eERC20Token = new EERC20Token(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            DECIMALS,
            encryptedTotalSupply,
            address(userRegistrar),
            address(balanceManager)
        );
        console.log("EERC20Token deployed at:", address(eERC20Token));

        // Step 5: Authorize eERC20Token contract in BalanceManager
        console.log("Authorizing EERC20Token in BalanceManager...");
        balanceManager.authorizeContract(address(eERC20Token));

        // Step 6: Register deployer as initial user
        console.log("Registering deployer as initial user...");
        bytes memory deployerPublicKey = generatePublicKey(deployer);
        userRegistrar.registerUser(deployerPublicKey);

        // Step 7: Mint initial supply to deployer
        console.log("Minting initial supply to deployer...");
        bytes memory encryptedInitialAmount = generateEncryptedAmount(
            INITIAL_SUPPLY,
            deployer
        );
        bytes memory mintProof = generateMintProof(deployer, INITIAL_SUPPLY);
        eERC20Token.mint(deployer, encryptedInitialAmount, mintProof);

        vm.stopBroadcast();

        // Step 8: Log deployment addresses (file writing disabled in simulation)
        // saveDeploymentAddresses();

        console.log("eERC20 infrastructure deployment completed successfully!");
        console.log("=== Deployment Summary ===");
        console.log("UserRegistrar:", address(userRegistrar));
        console.log("EncryptedBalanceManager:", address(balanceManager));
        console.log("EERC20Token:", address(eERC20Token));
        console.log("Token Name:", TOKEN_NAME);
        console.log("Token Symbol:", TOKEN_SYMBOL);
        console.log("Initial Supply:", INITIAL_SUPPLY);
    }

    /**
     * @dev Generate encrypted total supply (simplified implementation)
     */
    function generateEncryptedSupply(
        uint256 supply
    ) internal pure returns (bytes memory) {
        // Simplified encryption - in real implementation, this would use proper encryption
        return
            abi.encodePacked(
                keccak256(abi.encodePacked("total_supply", supply))
            );
    }

    /**
     * @dev Generate public key for user (simplified implementation)
     */
    function generatePublicKey(
        address user
    ) internal view returns (bytes memory) {
        // Simplified key generation - in real implementation, this would be proper RSA/ECC key
        bytes32 keyHash = keccak256(
            abi.encodePacked("public_key", user, block.timestamp)
        );
        return abi.encodePacked(keyHash, keyHash); // 64 bytes key
    }

    /**
     * @dev Generate encrypted amount for user (simplified implementation)
     */
    function generateEncryptedAmount(
        uint256 amount,
        address user
    ) internal pure returns (bytes memory) {
        // Simplified encryption - in real implementation, this would use user's public key
        return
            abi.encodePacked(
                keccak256(abi.encodePacked("encrypted_amount", amount, user))
            );
    }

    /**
     * @dev Generate mint proof (simplified implementation)
     */
    function generateMintProof(
        address user,
        uint256 amount
    ) internal pure returns (bytes memory) {
        // Simplified proof generation - in real implementation, this would be zk-SNARK proof
        return
            abi.encodePacked(
                keccak256(abi.encodePacked("mint_proof", user, amount))
            );
    }

    /**
     * @dev Save deployment addresses to configuration file
     */
    function saveDeploymentAddresses() internal {
        string memory json = string(
            abi.encodePacked(
                "{\n",
                '  "userRegistrar": "',
                vm.toString(address(userRegistrar)),
                '",\n',
                '  "encryptedBalanceManager": "',
                vm.toString(address(balanceManager)),
                '",\n',
                '  "eERC20Token": "',
                vm.toString(address(eERC20Token)),
                '",\n',
                '  "deploymentBlock": ',
                vm.toString(block.number),
                ",\n",
                '  "deploymentTimestamp": ',
                vm.toString(block.timestamp),
                "\n",
                "}"
            )
        );

        vm.writeFile("./deployment-addresses.json", json);
        console.log("Deployment addresses saved to deployment-addresses.json");
    }
}
