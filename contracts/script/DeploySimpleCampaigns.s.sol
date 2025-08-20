// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../contracts/SimpleCampaignFactory.sol";

/**
 * @title DeploySimpleCampaigns
 * @dev Deployment script for SimpleCampaign infrastructure
 * Deploys only the campaign contracts - eERC20 contracts are already deployed on Avalanche L1
 */
contract DeploySimpleCampaigns is Script {
    SimpleCampaignFactory public factory;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying SimpleCampaign infrastructure...");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy SimpleCampaignFactory
        console.log("Deploying SimpleCampaignFactory...");
        factory = new SimpleCampaignFactory();
        console.log("SimpleCampaignFactory deployed at:", address(factory));

        vm.stopBroadcast();

        console.log(
            "SimpleCampaign infrastructure deployment completed successfully!"
        );
        console.log("=== Deployment Summary ===");
        console.log("SimpleCampaignFactory:", address(factory));
        console.log("");
        console.log("=== eERC20 Integration Info ===");
        console.log(
            "Standalone eERC20 (Fuji):",
            "0x5E9c6F952fB9615583182e70eDDC4e6E4E0aC0e0"
        );
        console.log(
            "Converter eERC20 (Fuji):",
            "0x372dAB27c8d223Af11C858ea00037Dc03053B22E"
        );
        console.log(
            "Demo ERC20 (Fuji):",
            "0xb0Fe621B4Bd7fe4975f7c58E3D6ADaEb2a2A35CD"
        );
        console.log("");
        console.log("Next steps:");
        console.log(
            "1. Update frontend config with SimpleCampaignFactory address"
        );
        console.log(
            "2. Ensure circuit files are available in frontend public directory"
        );
        console.log("3. Test eERC20 SDK integration with deployed contracts");
    }
}
