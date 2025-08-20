// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/CampaignManager.sol";
import "../contracts/interfaces/ICampaignManager.sol";
import "../contracts/interfaces/ICampaign.sol";
import "../contracts/interfaces/ICampaignFactory.sol";

// Mock contracts for testing
contract MockCampaignFactory {
    address[] private campaigns;
    mapping(address => bool) private registered;
    uint256 private totalCampaigns;
    uint256 private activeCampaigns;

    function addCampaign(address campaign) external {
        campaigns.push(campaign);
        registered[campaign] = true;
        totalCampaigns++;
        activeCampaigns++;
    }

    function getCampaigns() external view returns (address[] memory) {
        return campaigns;
    }

    function isCampaignRegistered(
        address campaign
    ) external view returns (bool) {
        return registered[campaign];
    }

    function getCampaignStats() external view returns (uint256, uint256) {
        return (totalCampaigns, activeCampaigns);
    }

    function setActiveCampaigns(uint256 _active) external {
        activeCampaigns = _active;
    }
}

contract MockCampaign {
    bool public isActive;
    uint256 public deadline;
    address public creator;
    string public title;

    constructor(
        bool _isActive,
        uint256 _deadline,
        address _creator,
        string memory _title
    ) {
        isActive = _isActive;
        deadline = _deadline;
        creator = _creator;
        title = _title;
    }

    function isDeadlinePassed() external view returns (bool) {
        return block.timestamp > deadline;
    }

    function getCampaignInfo()
        external
        view
        returns (ICampaign.CampaignInfo memory)
    {
        return
            ICampaign.CampaignInfo({
                creator: creator,
                title: title,
                description: "Test description",
                deadline: deadline,
                isActive: isActive,
                encryptedGoal: abi.encodePacked("encrypted_goal")
            });
    }

    function updateStatus() external {
        if (block.timestamp > deadline) {
            isActive = false;
        }
    }
}

/**
 * @title CampaignManagerSimpleTest
 * @dev Simple tests for CampaignManager contract functionality
 */
contract CampaignManagerSimpleTest is Test {
    // ============ Test Contracts ============

    CampaignManager public campaignManager;
    MockCampaignFactory public mockFactory;

    // ============ Test Addresses ============

    address public creator1 = address(0x1);
    address public creator2 = address(0x2);

    // ============ Events ============

    event CampaignStatusUpdated(
        address indexed campaign,
        bool isActive,
        uint256 timestamp
    );
    event BatchOperationCompleted(
        string operation,
        uint256 processedCount,
        uint256 timestamp
    );

    // ============ Setup ============

    function setUp() public {
        // Set a proper timestamp for testing
        vm.warp(1000000);

        // Deploy mock factory
        mockFactory = new MockCampaignFactory();

        // Deploy campaign manager
        campaignManager = new CampaignManager(address(mockFactory));
    }

    // ============ Constructor Tests ============

    function testConstructor() public {
        assertEq(
            address(campaignManager.campaignFactory()),
            address(mockFactory)
        );
        assertEq(campaignManager.MAX_BATCH_SIZE(), 50);
    }

    function testConstructorWithInvalidFactory() public {
        vm.expectRevert(CampaignManager.InvalidCampaignFactory.selector);
        new CampaignManager(address(0));
    }

    // ============ Status Management Tests ============

    function testIsDeadlinePassed() public {
        uint256 futureTime = block.timestamp + 7 days;
        uint256 pastTime = block.timestamp - 1 days;

        MockCampaign activeCampaign = new MockCampaign(
            true,
            futureTime,
            creator1,
            "Active Campaign"
        );
        MockCampaign expiredCampaign = new MockCampaign(
            true,
            pastTime,
            creator2,
            "Expired Campaign"
        );

        mockFactory.addCampaign(address(activeCampaign));
        mockFactory.addCampaign(address(expiredCampaign));

        assertFalse(campaignManager.isDeadlinePassed(address(activeCampaign)));
        assertTrue(campaignManager.isDeadlinePassed(address(expiredCampaign)));
    }

    function testIsDeadlinePassedWithUnregisteredCampaign() public {
        address fakeCampaign = address(0x999);

        vm.expectRevert(CampaignManager.CampaignNotRegistered.selector);
        campaignManager.isDeadlinePassed(fakeCampaign);
    }

    function testUpdateCampaignStatus() public {
        uint256 pastTime = block.timestamp - 1 days;
        MockCampaign expiredCampaign = new MockCampaign(
            true,
            pastTime,
            creator1,
            "Expired Campaign"
        );

        mockFactory.addCampaign(address(expiredCampaign));

        // Verify campaign is initially active
        assertTrue(expiredCampaign.isActive());

        // Update status should deactivate expired campaign
        vm.expectEmit(true, false, false, true);
        emit CampaignStatusUpdated(
            address(expiredCampaign),
            false,
            block.timestamp
        );

        campaignManager.updateCampaignStatus(address(expiredCampaign));

        // Verify campaign is now inactive
        assertFalse(expiredCampaign.isActive());
    }

    function testUpdateCampaignStatusWithActiveCampaign() public {
        uint256 futureTime = block.timestamp + 7 days;
        MockCampaign activeCampaign = new MockCampaign(
            true,
            futureTime,
            creator1,
            "Active Campaign"
        );

        mockFactory.addCampaign(address(activeCampaign));

        // Verify campaign is active
        assertTrue(activeCampaign.isActive());

        // Update status should not change active campaign
        campaignManager.updateCampaignStatus(address(activeCampaign));

        // Verify campaign is still active
        assertTrue(activeCampaign.isActive());
    }

    function testBatchUpdateCampaignStatus() public {
        uint256 futureTime = block.timestamp + 7 days;
        uint256 pastTime = block.timestamp - 1 days;

        MockCampaign activeCampaign = new MockCampaign(
            true,
            futureTime,
            creator1,
            "Active Campaign"
        );
        MockCampaign expiredCampaign = new MockCampaign(
            true,
            pastTime,
            creator2,
            "Expired Campaign"
        );

        mockFactory.addCampaign(address(activeCampaign));
        mockFactory.addCampaign(address(expiredCampaign));

        address[] memory campaigns = new address[](2);
        campaigns[0] = address(activeCampaign);
        campaigns[1] = address(expiredCampaign);

        vm.expectEmit(false, false, false, true);
        emit BatchOperationCompleted(
            "batchUpdateCampaignStatus",
            1,
            block.timestamp
        );

        campaignManager.batchUpdateCampaignStatus(campaigns);

        // Check that expired campaign was deactivated
        assertFalse(expiredCampaign.isActive());

        // Check that active campaign remains active
        assertTrue(activeCampaign.isActive());
    }

    function testBatchUpdateCampaignStatusExceedsLimit() public {
        address[] memory largeBatch = new address[](51);

        vm.expectRevert(CampaignManager.BatchSizeExceeded.selector);
        campaignManager.batchUpdateCampaignStatus(largeBatch);
    }

    // ============ Statistics Tests ============

    function testGetCampaignStats() public {
        mockFactory.setActiveCampaigns(5);

        (uint256 totalCampaigns, uint256 activeCampaigns) = campaignManager
            .getCampaignStats();

        assertEq(totalCampaigns, 0); // No campaigns added yet
        assertEq(activeCampaigns, 5);
    }

    function testGetDetailedCampaignStats() public {
        uint256 futureTime = block.timestamp + 7 days;
        uint256 pastTime = block.timestamp - 1 days;

        MockCampaign activeCampaign1 = new MockCampaign(
            true,
            futureTime,
            creator1,
            "Active 1"
        );
        MockCampaign activeCampaign2 = new MockCampaign(
            true,
            futureTime,
            creator2,
            "Active 2"
        );
        MockCampaign expiredCampaign = new MockCampaign(
            true,
            pastTime,
            creator1,
            "Expired"
        );

        mockFactory.addCampaign(address(activeCampaign1));
        mockFactory.addCampaign(address(activeCampaign2));
        mockFactory.addCampaign(address(expiredCampaign));

        (
            uint256 totalCampaigns,
            uint256 activeCampaigns,
            uint256 expiredCampaigns,
            uint256 completedCampaigns
        ) = campaignManager.getDetailedCampaignStats();

        assertEq(totalCampaigns, 3);
        assertEq(activeCampaigns, 2);
        assertEq(expiredCampaigns, 1);
        assertEq(completedCampaigns, 0);
    }

    function testGetCampaignsExpiringWithin() public {
        uint256 nearFuture = block.timestamp + 1 hours;
        uint256 farFuture = block.timestamp + 7 days;

        MockCampaign expiringSoon = new MockCampaign(
            true,
            nearFuture,
            creator1,
            "Expiring Soon"
        );
        MockCampaign expiringLater = new MockCampaign(
            true,
            farFuture,
            creator2,
            "Expiring Later"
        );

        mockFactory.addCampaign(address(expiringSoon));
        mockFactory.addCampaign(address(expiringLater));

        address[] memory expiring = campaignManager.getCampaignsExpiringWithin(
            2 hours
        );

        assertEq(expiring.length, 1);
        assertEq(expiring[0], address(expiringSoon));
    }

    // ============ Lifecycle Management Tests ============

    function testNeedsStatusUpdate() public {
        uint256 futureTime = block.timestamp + 7 days;
        uint256 pastTime = block.timestamp - 1 days;

        MockCampaign activeCampaign = new MockCampaign(
            true,
            futureTime,
            creator1,
            "Active"
        );
        MockCampaign expiredCampaign = new MockCampaign(
            true,
            pastTime,
            creator2,
            "Expired"
        );

        mockFactory.addCampaign(address(activeCampaign));
        mockFactory.addCampaign(address(expiredCampaign));

        assertFalse(campaignManager.needsStatusUpdate(address(activeCampaign)));
        assertTrue(campaignManager.needsStatusUpdate(address(expiredCampaign)));
    }

    function testNeedsStatusUpdateWithUnregisteredCampaign() public {
        address fakeCampaign = address(0x999);
        assertFalse(campaignManager.needsStatusUpdate(fakeCampaign));
    }

    function testGetCampaignLifecycleInfo() public {
        uint256 futureTime = block.timestamp + 7 days;
        uint256 pastTime = block.timestamp - 1 days;

        MockCampaign activeCampaign = new MockCampaign(
            true,
            futureTime,
            creator1,
            "Active"
        );
        MockCampaign expiredCampaign = new MockCampaign(
            true,
            pastTime,
            creator2,
            "Expired"
        );

        mockFactory.addCampaign(address(activeCampaign));
        mockFactory.addCampaign(address(expiredCampaign));

        // Test active campaign
        (
            bool isActive,
            bool isExpired,
            uint256 timeRemaining,
            bool needsUpdate
        ) = campaignManager.getCampaignLifecycleInfo(address(activeCampaign));

        assertTrue(isActive);
        assertFalse(isExpired);
        assertEq(timeRemaining, futureTime - block.timestamp);
        assertFalse(needsUpdate);

        // Test expired campaign
        (isActive, isExpired, timeRemaining, needsUpdate) = campaignManager
            .getCampaignLifecycleInfo(address(expiredCampaign));

        assertTrue(isActive); // Still marked as active until updated
        assertTrue(isExpired);
        assertEq(timeRemaining, 0);
        assertTrue(needsUpdate);
    }

    function testPerformMaintenanceOnExpiredCampaigns() public {
        uint256 futureTime = block.timestamp + 7 days;
        uint256 pastTime = block.timestamp - 1 days;

        MockCampaign activeCampaign = new MockCampaign(
            true,
            futureTime,
            creator1,
            "Active"
        );
        MockCampaign expiredCampaign = new MockCampaign(
            true,
            pastTime,
            creator2,
            "Expired"
        );

        mockFactory.addCampaign(address(activeCampaign));
        mockFactory.addCampaign(address(expiredCampaign));

        vm.expectEmit(false, false, false, true);
        emit BatchOperationCompleted(
            "performMaintenanceOnExpiredCampaigns",
            1,
            block.timestamp
        );

        uint256 processed = campaignManager
            .performMaintenanceOnExpiredCampaigns(10);

        assertEq(processed, 1);

        // Check that expired campaign was deactivated
        assertFalse(expiredCampaign.isActive());
    }

    // ============ Batch Operations Tests ============

    function testGetBatchCampaignLifecycleInfo() public {
        uint256 futureTime = block.timestamp + 7 days;
        uint256 pastTime = block.timestamp - 1 days;

        MockCampaign activeCampaign = new MockCampaign(
            true,
            futureTime,
            creator1,
            "Active"
        );
        MockCampaign expiredCampaign = new MockCampaign(
            true,
            pastTime,
            creator2,
            "Expired"
        );

        mockFactory.addCampaign(address(activeCampaign));
        mockFactory.addCampaign(address(expiredCampaign));

        address[] memory campaigns = new address[](2);
        campaigns[0] = address(activeCampaign);
        campaigns[1] = address(expiredCampaign);

        (
            bool[] memory isActive,
            bool[] memory isExpired,
            uint256[] memory timeRemaining,
            bool[] memory needsUpdate
        ) = campaignManager.getBatchCampaignLifecycleInfo(campaigns);

        assertEq(isActive.length, 2);
        assertEq(isExpired.length, 2);
        assertEq(timeRemaining.length, 2);
        assertEq(needsUpdate.length, 2);

        // Check active campaign
        assertTrue(isActive[0]);
        assertFalse(isExpired[0]);
        assertFalse(needsUpdate[0]);

        // Check expired campaign
        assertTrue(isActive[1]);
        assertTrue(isExpired[1]);
        assertTrue(needsUpdate[1]);
        assertEq(timeRemaining[1], 0);
    }

    function testBatchNeedsStatusUpdate() public {
        uint256 futureTime = block.timestamp + 7 days;
        uint256 pastTime = block.timestamp - 1 days;

        MockCampaign activeCampaign = new MockCampaign(
            true,
            futureTime,
            creator1,
            "Active"
        );
        MockCampaign expiredCampaign = new MockCampaign(
            true,
            pastTime,
            creator2,
            "Expired"
        );

        mockFactory.addCampaign(address(activeCampaign));
        mockFactory.addCampaign(address(expiredCampaign));

        address[] memory campaigns = new address[](2);
        campaigns[0] = address(activeCampaign);
        campaigns[1] = address(expiredCampaign);

        bool[] memory results = campaignManager.batchNeedsStatusUpdate(
            campaigns
        );

        assertEq(results.length, 2);
        assertFalse(results[0]); // Active campaign
        assertTrue(results[1]); // Expired campaign
    }

    function testBatchOperationsExceedLimit() public {
        address[] memory largeBatch = new address[](51);

        vm.expectRevert(CampaignManager.BatchSizeExceeded.selector);
        campaignManager.getBatchCampaignLifecycleInfo(largeBatch);

        vm.expectRevert(CampaignManager.BatchSizeExceeded.selector);
        campaignManager.batchNeedsStatusUpdate(largeBatch);
    }

    // ============ Edge Cases ============

    function testEmptyBatchOperations() public {
        address[] memory emptyBatch = new address[](0);

        // Should not revert with empty batch
        campaignManager.batchUpdateCampaignStatus(emptyBatch);

        bool[] memory results = campaignManager.batchNeedsStatusUpdate(
            emptyBatch
        );
        assertEq(results.length, 0);
    }

    function testUpdateAllCampaignStatusesWithNoExistingCampaigns() public {
        vm.expectEmit(false, false, false, true);
        emit BatchOperationCompleted(
            "updateAllCampaignStatuses",
            0,
            block.timestamp
        );

        campaignManager.updateAllCampaignStatuses(0, 10);
    }

    function testUpdateAllCampaignStatusesInvalidBatchSize() public {
        vm.expectRevert(CampaignManager.InvalidBatchSize.selector);
        campaignManager.updateAllCampaignStatuses(0, 0);

        vm.expectRevert(CampaignManager.InvalidBatchSize.selector);
        campaignManager.updateAllCampaignStatuses(0, 51);
    }
}
