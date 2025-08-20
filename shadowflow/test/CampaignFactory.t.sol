// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "lib/forge-std/src/Test.sol";
import "../contracts/CampaignFactory.sol";
import "../contracts/Campaign.sol";

contract MockPrivacyManager {
    mapping(address => bool) public registeredUsers;

    function isUserRegistered(address user) external view returns (bool) {
        return registeredUsers[user];
    }

    function registerUser(address user) external {
        registeredUsers[user] = true;
    }

    function isValidEncryptedAmount(bytes memory) external pure returns (bool) {
        return true;
    }

    function generateZeroAmount() external pure returns (bytes memory) {
        return
            hex"0000000000000000000000000000000000000000000000000000000000000000";
    }

    function verifyDonationProof(
        address,
        address,
        bytes memory,
        bytes memory
    ) external pure returns (bool) {
        return true;
    }

    function verifyWithdrawalProof(
        address,
        address,
        bytes memory,
        bytes memory
    ) external pure returns (bool) {
        return true;
    }

    function addEncryptedAmounts(
        bytes memory a,
        bytes memory
    ) external pure returns (bytes memory) {
        return a; // Simple mock implementation
    }

    function authorizeCampaign(address) external {}

    function revokeCampaign(address) external {}
}

contract CampaignFactoryTest is Test {
    CampaignFactory public factory;
    Campaign public campaignTemplate;
    MockPrivacyManager public privacyManager;

    address public creator = address(0x1);
    address public donor = address(0x2);

    string constant CAMPAIGN_TITLE = "Test Campaign";
    string constant CAMPAIGN_DESCRIPTION =
        "A test campaign for privacy-preserving donations";
    uint256 constant CAMPAIGN_DEADLINE = 1735689600; // Jan 1, 2025
    bytes constant ENCRYPTED_GOAL =
        hex"1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

    function setUp() public {
        // Deploy mock privacy manager
        privacyManager = new MockPrivacyManager();

        // Deploy campaign template
        campaignTemplate = new Campaign();

        // Deploy factory
        factory = new CampaignFactory(
            address(campaignTemplate),
            address(privacyManager)
        );

        // Register users
        privacyManager.registerUser(creator);
        privacyManager.registerUser(donor);
    }

    function testCreateCampaign() public {
        vm.prank(creator);
        address campaignAddress = factory.createCampaign(
            CAMPAIGN_TITLE,
            CAMPAIGN_DESCRIPTION,
            ENCRYPTED_GOAL,
            CAMPAIGN_DEADLINE
        );

        // Verify campaign was created
        assertTrue(campaignAddress != address(0));
        assertTrue(factory.isCampaignRegistered(campaignAddress));
    }

    function testGetCampaigns() public {
        // Create multiple campaigns
        vm.startPrank(creator);
        address campaign1 = factory.createCampaign(
            "Campaign 1",
            "Description 1",
            ENCRYPTED_GOAL,
            CAMPAIGN_DEADLINE
        );
        address campaign2 = factory.createCampaign(
            "Campaign 2",
            "Description 2",
            ENCRYPTED_GOAL,
            CAMPAIGN_DEADLINE
        );
        vm.stopPrank();

        // Test getCampaigns
        address[] memory allCampaigns = factory.getCampaigns();
        assertEq(allCampaigns.length, 2);
        assertEq(allCampaigns[0], campaign1);
        assertEq(allCampaigns[1], campaign2);

        // Test getCampaignsByCreator
        address[] memory creatorCampaigns = factory.getCampaignsByCreator(
            creator
        );
        assertEq(creatorCampaigns.length, 2);
        assertEq(creatorCampaigns[0], campaign1);
        assertEq(creatorCampaigns[1], campaign2);

        // Test getTotalCampaigns
        assertEq(factory.getTotalCampaigns(), 2);
    }

    function testCreateCampaignValidation() public {
        // Test empty title
        vm.prank(creator);
        vm.expectRevert(CampaignFactory.EmptyTitle.selector);
        factory.createCampaign(
            "",
            CAMPAIGN_DESCRIPTION,
            ENCRYPTED_GOAL,
            CAMPAIGN_DEADLINE
        );

        // Test invalid deadline
        vm.prank(creator);
        vm.expectRevert(CampaignFactory.InvalidDeadline.selector);
        factory.createCampaign(
            CAMPAIGN_TITLE,
            CAMPAIGN_DESCRIPTION,
            ENCRYPTED_GOAL,
            block.timestamp - 1
        );

        // Test unregistered user
        vm.prank(address(0x999));
        vm.expectRevert(CampaignFactory.UserNotRegistered.selector);
        factory.createCampaign(
            CAMPAIGN_TITLE,
            CAMPAIGN_DESCRIPTION,
            ENCRYPTED_GOAL,
            CAMPAIGN_DEADLINE
        );
    }

    function testCampaignStats() public {
        // Initially no campaigns
        (uint256 totalCampaigns, uint256 activeCampaigns) = factory
            .getCampaignStats();
        assertEq(totalCampaigns, 0);
        assertEq(activeCampaigns, 0);

        // Create a campaign
        vm.prank(creator);
        factory.createCampaign(
            CAMPAIGN_TITLE,
            CAMPAIGN_DESCRIPTION,
            ENCRYPTED_GOAL,
            CAMPAIGN_DEADLINE
        );

        // Check stats
        (totalCampaigns, activeCampaigns) = factory.getCampaignStats();
        assertEq(totalCampaigns, 1);
        assertEq(activeCampaigns, 1);
    }

    function testCampaignRegistration() public {
        vm.prank(creator);
        address campaignAddress = factory.createCampaign(
            CAMPAIGN_TITLE,
            CAMPAIGN_DESCRIPTION,
            ENCRYPTED_GOAL,
            CAMPAIGN_DEADLINE
        );

        // Test campaign is registered
        assertTrue(factory.isCampaignRegistered(campaignAddress));

        // Test random address is not registered
        assertFalse(factory.isCampaignRegistered(address(0x999)));
    }
}
