// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/SimpleCampaignFactory.sol";
import "../contracts/SimpleCampaign.sol";

contract SimpleCampaignFactoryTest is Test {
    SimpleCampaignFactory public factory;

    address public creator1 = address(0x1);
    address public creator2 = address(0x2);

    string public constant TITLE1 = "Campaign 1";
    string public constant TITLE2 = "Campaign 2";
    string public constant DESCRIPTION = "Test campaign description";
    uint256 public deadline;

    function setUp() public {
        factory = new SimpleCampaignFactory();
        deadline = block.timestamp + 30 days;
    }

    // ============ Campaign Creation Tests ============

    function testCreateCampaignSuccess() public {
        vm.prank(creator1);
        address campaignAddress = factory.createCampaign(
            TITLE1,
            DESCRIPTION,
            deadline
        );

        assertTrue(campaignAddress != address(0));
        assertTrue(factory.isCampaignRegistered(campaignAddress));
        assertEq(factory.getCampaignCount(), 1);

        // Verify campaign was created correctly
        SimpleCampaign campaign = SimpleCampaign(campaignAddress);
        assertEq(campaign.creator(), creator1);
        assertEq(campaign.title(), TITLE1);
        assertEq(campaign.description(), DESCRIPTION);
        assertEq(campaign.deadline(), deadline);
        assertTrue(campaign.isActive());
    }

    function testCreateCampaignEmptyTitle() public {
        vm.prank(creator1);
        vm.expectRevert(SimpleCampaignFactory.EmptyTitle.selector);
        factory.createCampaign("", DESCRIPTION, deadline);
    }

    function testCreateCampaignInvalidDeadline() public {
        vm.prank(creator1);
        vm.expectRevert(SimpleCampaignFactory.InvalidDeadline.selector);
        factory.createCampaign(TITLE1, DESCRIPTION, block.timestamp - 1);
    }

    function testCreateMultipleCampaigns() public {
        vm.prank(creator1);
        address campaign1 = factory.createCampaign(
            TITLE1,
            DESCRIPTION,
            deadline
        );

        vm.prank(creator2);
        address campaign2 = factory.createCampaign(
            TITLE2,
            DESCRIPTION,
            deadline + 1 days
        );

        assertEq(factory.getCampaignCount(), 2);
        assertTrue(factory.isCampaignRegistered(campaign1));
        assertTrue(factory.isCampaignRegistered(campaign2));
    }

    // ============ Campaign Retrieval Tests ============

    function testGetCampaigns() public {
        vm.prank(creator1);
        address campaign1 = factory.createCampaign(
            TITLE1,
            DESCRIPTION,
            deadline
        );

        vm.prank(creator2);
        address campaign2 = factory.createCampaign(
            TITLE2,
            DESCRIPTION,
            deadline
        );

        address[] memory campaigns = factory.getCampaigns();
        assertEq(campaigns.length, 2);
        assertEq(campaigns[0], campaign1);
        assertEq(campaigns[1], campaign2);
    }

    function testGetCampaignsByCreator() public {
        vm.prank(creator1);
        address campaign1 = factory.createCampaign(
            TITLE1,
            DESCRIPTION,
            deadline
        );

        vm.prank(creator1);
        address campaign2 = factory.createCampaign(
            TITLE2,
            DESCRIPTION,
            deadline
        );

        vm.prank(creator2);
        address campaign3 = factory.createCampaign(
            "Campaign 3",
            DESCRIPTION,
            deadline
        );

        address[] memory creator1Campaigns = factory.getCampaignsByCreator(
            creator1
        );
        assertEq(creator1Campaigns.length, 2);
        assertEq(creator1Campaigns[0], campaign1);
        assertEq(creator1Campaigns[1], campaign2);

        address[] memory creator2Campaigns = factory.getCampaignsByCreator(
            creator2
        );
        assertEq(creator2Campaigns.length, 1);
        assertEq(creator2Campaigns[0], campaign3);
    }

    function testGetActiveCampaigns() public {
        vm.prank(creator1);
        address campaign1 = factory.createCampaign(
            TITLE1,
            DESCRIPTION,
            deadline
        );

        vm.prank(creator2);
        address campaign2 = factory.createCampaign(
            TITLE2,
            DESCRIPTION,
            deadline
        );

        // Deactivate campaign1
        vm.prank(creator1);
        SimpleCampaign(campaign1).updateStatus();

        address[] memory activeCampaigns = factory.getActiveCampaigns();
        assertEq(activeCampaigns.length, 1);
        assertEq(activeCampaigns[0], campaign2);
    }

    function testGetCampaignsByStatus() public {
        vm.prank(creator1);
        address campaign1 = factory.createCampaign(
            TITLE1,
            DESCRIPTION,
            deadline
        );

        vm.prank(creator2);
        address campaign2 = factory.createCampaign(
            TITLE2,
            DESCRIPTION,
            deadline
        );

        // Deactivate campaign1
        vm.prank(creator1);
        SimpleCampaign(campaign1).updateStatus();

        // Test active campaigns
        address[] memory activeCampaigns = factory.getCampaignsByStatus(true);
        assertEq(activeCampaigns.length, 1);
        assertEq(activeCampaigns[0], campaign2);

        // Test inactive campaigns
        address[] memory inactiveCampaigns = factory.getCampaignsByStatus(
            false
        );
        assertEq(inactiveCampaigns.length, 1);
        assertEq(inactiveCampaigns[0], campaign1);
    }

    function testGetCampaignsByStatusAfterDeadline() public {
        uint256 shortDeadline = block.timestamp + 1 hours;

        vm.prank(creator1);
        address campaign1 = factory.createCampaign(
            TITLE1,
            DESCRIPTION,
            shortDeadline
        );

        vm.prank(creator2);
        address campaign2 = factory.createCampaign(
            TITLE2,
            DESCRIPTION,
            deadline
        );

        // Move time past campaign1's deadline
        vm.warp(shortDeadline + 1);

        // campaign1 should be considered inactive due to deadline
        address[] memory activeCampaigns = factory.getCampaignsByStatus(true);
        assertEq(activeCampaigns.length, 1);
        assertEq(activeCampaigns[0], campaign2);

        address[] memory inactiveCampaigns = factory.getCampaignsByStatus(
            false
        );
        assertEq(inactiveCampaigns.length, 1);
        assertEq(inactiveCampaigns[0], campaign1);
    }

    // ============ Statistics Tests ============

    function testGetCampaignStats() public {
        vm.prank(creator1);
        address campaign1 = factory.createCampaign(
            TITLE1,
            DESCRIPTION,
            deadline
        );

        vm.prank(creator2);
        address campaign2 = factory.createCampaign(
            TITLE2,
            DESCRIPTION,
            deadline
        );

        (uint256 totalCampaigns, uint256 activeCampaigns) = factory
            .getCampaignStats();
        assertEq(totalCampaigns, 2);
        assertEq(activeCampaigns, 2);

        // Deactivate one campaign
        vm.prank(creator1);
        SimpleCampaign(campaign1).updateStatus();

        (totalCampaigns, activeCampaigns) = factory.getCampaignStats();
        assertEq(totalCampaigns, 2);
        assertEq(activeCampaigns, 1);
    }

    function testGetCampaignCount() public {
        assertEq(factory.getCampaignCount(), 0);

        vm.prank(creator1);
        factory.createCampaign(TITLE1, DESCRIPTION, deadline);
        assertEq(factory.getCampaignCount(), 1);

        vm.prank(creator2);
        factory.createCampaign(TITLE2, DESCRIPTION, deadline);
        assertEq(factory.getCampaignCount(), 2);
    }

    function testIsCampaignRegistered() public {
        address nonExistentCampaign = address(0x999);
        assertFalse(factory.isCampaignRegistered(nonExistentCampaign));

        vm.prank(creator1);
        address campaign = factory.createCampaign(
            TITLE1,
            DESCRIPTION,
            deadline
        );
        assertTrue(factory.isCampaignRegistered(campaign));
    }

    // ============ Event Tests ============

    event CampaignCreated(
        address indexed campaignAddress,
        address indexed creator,
        string title,
        uint256 deadline
    );

    function testCampaignCreatedEvent() public {
        vm.expectEmit(false, true, false, true);
        emit CampaignCreated(address(0), creator1, TITLE1, deadline);

        vm.prank(creator1);
        factory.createCampaign(TITLE1, DESCRIPTION, deadline);
    }

    // ============ Edge Cases ============

    function testEmptyFactoryState() public {
        assertEq(factory.getCampaignCount(), 0);

        address[] memory campaigns = factory.getCampaigns();
        assertEq(campaigns.length, 0);

        address[] memory activeCampaigns = factory.getActiveCampaigns();
        assertEq(activeCampaigns.length, 0);

        (uint256 totalCampaigns, uint256 activeCampaigns_) = factory
            .getCampaignStats();
        assertEq(totalCampaigns, 0);
        assertEq(activeCampaigns_, 0);
    }

    function testGetCampaignsByCreatorEmpty() public {
        address[] memory campaigns = factory.getCampaignsByCreator(creator1);
        assertEq(campaigns.length, 0);
    }

    function testGetCampaignInfoBatch() public {
        // Create multiple campaigns
        vm.prank(creator1);
        address campaign1 = factory.createCampaign(
            TITLE1,
            DESCRIPTION,
            deadline
        );

        vm.prank(creator2);
        address campaign2 = factory.createCampaign(
            TITLE2,
            DESCRIPTION,
            deadline
        );

        // Test batch retrieval
        address[] memory addresses = new address[](2);
        addresses[0] = campaign1;
        addresses[1] = campaign2;

        SimpleCampaign.CampaignInfo[] memory infos = factory
            .getCampaignInfoBatch(addresses);

        assertEq(infos.length, 2);
        assertEq(infos[0].creator, creator1);
        assertEq(infos[0].title, TITLE1);
        assertEq(infos[1].creator, creator2);
        assertEq(infos[1].title, TITLE2);
    }

    function testGetCampaignInfoBatchWithInvalidAddress() public {
        // Create one valid campaign
        vm.prank(creator1);
        address campaign1 = factory.createCampaign(
            TITLE1,
            DESCRIPTION,
            deadline
        );

        // Test batch with valid and invalid addresses
        address[] memory addresses = new address[](2);
        addresses[0] = campaign1;
        addresses[1] = address(0x999); // Invalid address

        SimpleCampaign.CampaignInfo[] memory infos = factory
            .getCampaignInfoBatch(addresses);

        assertEq(infos.length, 2);
        assertEq(infos[0].creator, creator1);
        assertEq(infos[0].title, TITLE1);
        // Second entry should have default values
        assertEq(infos[1].creator, address(0));
        assertEq(infos[1].title, "");
    }

    function testGetCampaignsPaginated() public {
        // Create 5 campaigns
        address[] memory campaigns = new address[](5);
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(creator1);
            campaigns[i] = factory.createCampaign(
                string(abi.encodePacked("Campaign ", i)),
                DESCRIPTION,
                deadline
            );
        }

        // Test first page (offset 0, limit 2)
        (address[] memory page1, bool hasMore1) = factory.getCampaignsPaginated(
            0,
            2
        );
        assertEq(page1.length, 2);
        assertEq(page1[0], campaigns[0]);
        assertEq(page1[1], campaigns[1]);
        assertTrue(hasMore1);

        // Test second page (offset 2, limit 2)
        (address[] memory page2, bool hasMore2) = factory.getCampaignsPaginated(
            2,
            2
        );
        assertEq(page2.length, 2);
        assertEq(page2[0], campaigns[2]);
        assertEq(page2[1], campaigns[3]);
        assertTrue(hasMore2);

        // Test last page (offset 4, limit 2)
        (address[] memory page3, bool hasMore3) = factory.getCampaignsPaginated(
            4,
            2
        );
        assertEq(page3.length, 1);
        assertEq(page3[0], campaigns[4]);
        assertFalse(hasMore3);

        // Test offset beyond total
        (address[] memory emptyPage, bool hasMoreEmpty) = factory
            .getCampaignsPaginated(10, 2);
        assertEq(emptyPage.length, 0);
        assertFalse(hasMoreEmpty);
    }
}
