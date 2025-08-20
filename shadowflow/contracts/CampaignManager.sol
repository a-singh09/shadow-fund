// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/ICampaignManager.sol";
import "./interfaces/ICampaign.sol";
import "./interfaces/ICampaignFactory.sol";

/**
 * @title CampaignManager
 * @dev Utility contract for campaign lifecycle management, statistics, and batch operations
 * Provides deadline checking, status updates, analytics, and maintenance functions
 */
contract CampaignManager is ICampaignManager {
    // ============ State Variables ============

    /// @dev Reference to the campaign factory contract
    ICampaignFactory public immutable campaignFactory;

    /// @dev Maximum batch size for operations to prevent gas limit issues
    uint256 public constant MAX_BATCH_SIZE = 50;

    // ============ Custom Errors ============

    error InvalidCampaignFactory();
    error InvalidCampaignAddress();
    error BatchSizeExceeded();
    error InvalidBatchSize();
    error CampaignNotRegistered();

    // ============ Constructor ============

    /**
     * @dev Initialize the campaign manager with factory reference
     * @param _campaignFactory Address of the campaign factory contract
     */
    constructor(address _campaignFactory) {
        if (_campaignFactory == address(0)) revert InvalidCampaignFactory();
        campaignFactory = ICampaignFactory(_campaignFactory);
    }

    // ============ Status Management Functions ============

    /**
     * @dev Check if a campaign's deadline has passed
     * @param campaign Address of the campaign contract
     * @return True if deadline has passed, false otherwise
     */
    function isDeadlinePassed(address campaign) external view returns (bool) {
        if (!campaignFactory.isCampaignRegistered(campaign)) {
            revert CampaignNotRegistered();
        }

        return ICampaign(campaign).isDeadlinePassed();
    }

    /**
     * @dev Update the status of a specific campaign
     * @param campaign Address of the campaign contract to update
     */
    function updateCampaignStatus(address campaign) external {
        if (!campaignFactory.isCampaignRegistered(campaign)) {
            revert CampaignNotRegistered();
        }

        ICampaign campaignContract = ICampaign(campaign);
        ICampaign.CampaignInfo memory info = campaignContract.getCampaignInfo();

        // Check if campaign needs status update
        bool wasActive = info.isActive;
        bool isExpired = campaignContract.isDeadlinePassed();

        if (wasActive && isExpired) {
            // Update the campaign status
            campaignContract.updateStatus();

            emit CampaignStatusUpdated(campaign, false, block.timestamp);
        }
    }

    /**
     * @dev Update status for multiple campaigns in batch
     * @param campaigns Array of campaign addresses to update
     */
    function batchUpdateCampaignStatus(address[] calldata campaigns) external {
        if (campaigns.length > MAX_BATCH_SIZE) revert BatchSizeExceeded();

        uint256 updatedCount = 0;

        for (uint256 i = 0; i < campaigns.length; i++) {
            address campaign = campaigns[i];

            if (!campaignFactory.isCampaignRegistered(campaign)) {
                continue; // Skip invalid campaigns
            }

            ICampaign campaignContract = ICampaign(campaign);
            ICampaign.CampaignInfo memory info = campaignContract
                .getCampaignInfo();

            // Check if campaign needs status update
            bool wasActive = info.isActive;
            bool isExpired = campaignContract.isDeadlinePassed();

            if (wasActive && isExpired) {
                campaignContract.updateStatus();
                emit CampaignStatusUpdated(campaign, false, block.timestamp);
                updatedCount++;
            }
        }

        emit BatchOperationCompleted(
            "batchUpdateCampaignStatus",
            updatedCount,
            block.timestamp
        );
    }

    /**
     * @dev Update status for all campaigns (with pagination)
     * @param startIndex Starting index for batch processing
     * @param batchSize Number of campaigns to process in this batch
     */
    function updateAllCampaignStatuses(
        uint256 startIndex,
        uint256 batchSize
    ) external {
        if (batchSize == 0 || batchSize > MAX_BATCH_SIZE)
            revert InvalidBatchSize();

        address[] memory allCampaigns = campaignFactory.getCampaigns();

        if (startIndex >= allCampaigns.length) {
            emit BatchOperationCompleted(
                "updateAllCampaignStatuses",
                0,
                block.timestamp
            );
            return;
        }

        uint256 endIndex = startIndex + batchSize;
        if (endIndex > allCampaigns.length) {
            endIndex = allCampaigns.length;
        }

        uint256 updatedCount = 0;

        for (uint256 i = startIndex; i < endIndex; i++) {
            address campaign = allCampaigns[i];

            ICampaign campaignContract = ICampaign(campaign);
            ICampaign.CampaignInfo memory info = campaignContract
                .getCampaignInfo();

            // Check if campaign needs status update
            bool wasActive = info.isActive;
            bool isExpired = campaignContract.isDeadlinePassed();

            if (wasActive && isExpired) {
                campaignContract.updateStatus();
                emit CampaignStatusUpdated(campaign, false, block.timestamp);
                updatedCount++;
            }
        }

        emit BatchOperationCompleted(
            "updateAllCampaignStatuses",
            updatedCount,
            block.timestamp
        );
    }

    // ============ Statistics and Analytics Functions ============

    /**
     * @dev Get overall campaign statistics
     * @return totalCampaigns Total number of campaigns created
     * @return activeCampaigns Number of currently active campaigns
     */
    function getCampaignStats()
        external
        view
        returns (uint256 totalCampaigns, uint256 activeCampaigns)
    {
        return campaignFactory.getCampaignStats();
    }

    /**
     * @dev Get detailed campaign analytics
     * @return totalCampaigns Total campaigns created
     * @return activeCampaigns Currently active campaigns
     * @return expiredCampaigns Campaigns past their deadline
     * @return completedCampaigns Campaigns marked as completed
     */
    function getDetailedCampaignStats()
        external
        view
        returns (
            uint256 totalCampaigns,
            uint256 activeCampaigns,
            uint256 expiredCampaigns,
            uint256 completedCampaigns
        )
    {
        address[] memory allCampaigns = campaignFactory.getCampaigns();
        totalCampaigns = allCampaigns.length;

        uint256 activeCount = 0;
        uint256 expiredCount = 0;
        uint256 completedCount = 0;

        for (uint256 i = 0; i < allCampaigns.length; i++) {
            ICampaign campaignContract = ICampaign(allCampaigns[i]);
            ICampaign.CampaignInfo memory info = campaignContract
                .getCampaignInfo();
            bool isExpired = campaignContract.isDeadlinePassed();

            if (info.isActive && !isExpired) {
                activeCount++;
            } else if (isExpired) {
                expiredCount++;
            } else {
                completedCount++;
            }
        }

        return (totalCampaigns, activeCount, expiredCount, completedCount);
    }

    /**
     * @dev Get campaigns by status with pagination
     * @param isActive Filter by active status
     * @param startIndex Starting index for pagination
     * @param limit Maximum number of campaigns to return
     * @return campaigns Array of campaign addresses
     * @return hasMore True if there are more campaigns beyond the limit
     */
    function getCampaignsByStatusPaginated(
        bool isActive,
        uint256 startIndex,
        uint256 limit
    ) external view returns (address[] memory campaigns, bool hasMore) {
        if (limit > MAX_BATCH_SIZE) limit = MAX_BATCH_SIZE;

        address[] memory allCampaigns = campaignFactory.getCampaigns();

        // First pass: count matching campaigns from startIndex
        uint256 matchingCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < allCampaigns.length; i++) {
            ICampaign campaignContract = ICampaign(allCampaigns[i]);
            ICampaign.CampaignInfo memory info = campaignContract
                .getCampaignInfo();
            bool isExpired = campaignContract.isDeadlinePassed();
            bool campaignActive = info.isActive && !isExpired;

            if (campaignActive == isActive) {
                if (currentIndex >= startIndex) {
                    matchingCount++;
                    if (matchingCount > limit) {
                        break; // We found more than limit, so hasMore = true
                    }
                }
                currentIndex++;
            }
        }

        // Determine actual return size and hasMore flag
        uint256 returnSize = matchingCount > limit ? limit : matchingCount;
        hasMore = matchingCount > limit;

        campaigns = new address[](returnSize);

        // Second pass: populate the result array
        uint256 resultIndex = 0;
        currentIndex = 0;

        for (
            uint256 i = 0;
            i < allCampaigns.length && resultIndex < returnSize;
            i++
        ) {
            ICampaign campaignContract = ICampaign(allCampaigns[i]);
            ICampaign.CampaignInfo memory info = campaignContract
                .getCampaignInfo();
            bool isExpired = campaignContract.isDeadlinePassed();
            bool campaignActive = info.isActive && !isExpired;

            if (campaignActive == isActive) {
                if (currentIndex >= startIndex) {
                    campaigns[resultIndex] = allCampaigns[i];
                    resultIndex++;
                }
                currentIndex++;
            }
        }

        return (campaigns, hasMore);
    }

    /**
     * @dev Get campaigns expiring within a specific timeframe
     * @param timeframe Time in seconds from now
     * @return Array of campaign addresses expiring within the timeframe
     */
    function getCampaignsExpiringWithin(
        uint256 timeframe
    ) external view returns (address[] memory) {
        address[] memory allCampaigns = campaignFactory.getCampaigns();
        uint256 targetTime = block.timestamp + timeframe;

        // First pass: count expiring campaigns
        uint256 expiringCount = 0;
        for (uint256 i = 0; i < allCampaigns.length; i++) {
            ICampaign campaignContract = ICampaign(allCampaigns[i]);
            ICampaign.CampaignInfo memory info = campaignContract
                .getCampaignInfo();

            if (
                info.isActive &&
                info.deadline > block.timestamp &&
                info.deadline <= targetTime
            ) {
                expiringCount++;
            }
        }

        // Second pass: populate expiring campaigns array
        address[] memory expiringCampaigns = new address[](expiringCount);
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < allCampaigns.length; i++) {
            ICampaign campaignContract = ICampaign(allCampaigns[i]);
            ICampaign.CampaignInfo memory info = campaignContract
                .getCampaignInfo();

            if (
                info.isActive &&
                info.deadline > block.timestamp &&
                info.deadline <= targetTime
            ) {
                expiringCampaigns[currentIndex] = allCampaigns[i];
                currentIndex++;
            }
        }

        return expiringCampaigns;
    }

    // ============ Lifecycle Management Functions ============

    /**
     * @dev Check if a campaign needs status update
     * @param campaign Address of the campaign contract
     * @return True if campaign needs status update, false otherwise
     */
    function needsStatusUpdate(address campaign) external view returns (bool) {
        if (!campaignFactory.isCampaignRegistered(campaign)) {
            return false;
        }

        ICampaign campaignContract = ICampaign(campaign);
        ICampaign.CampaignInfo memory info = campaignContract.getCampaignInfo();
        bool isExpired = campaignContract.isDeadlinePassed();

        // Campaign needs update if it's active but expired
        return info.isActive && isExpired;
    }

    /**
     * @dev Get campaign lifecycle information
     * @param campaign Address of the campaign contract
     * @return isActive Current active status
     * @return isExpired Whether deadline has passed
     * @return timeRemaining Seconds until deadline (0 if expired)
     * @return needsUpdate Whether status needs updating
     */
    function getCampaignLifecycleInfo(
        address campaign
    )
        external
        view
        returns (
            bool isActive,
            bool isExpired,
            uint256 timeRemaining,
            bool needsUpdate
        )
    {
        if (!campaignFactory.isCampaignRegistered(campaign)) {
            revert CampaignNotRegistered();
        }

        ICampaign campaignContract = ICampaign(campaign);
        ICampaign.CampaignInfo memory info = campaignContract.getCampaignInfo();

        isActive = info.isActive;
        isExpired = campaignContract.isDeadlinePassed();

        if (isExpired || info.deadline <= block.timestamp) {
            timeRemaining = 0;
        } else {
            timeRemaining = info.deadline - block.timestamp;
        }

        needsUpdate = isActive && isExpired;

        return (isActive, isExpired, timeRemaining, needsUpdate);
    }

    /**
     * @dev Perform maintenance on expired campaigns
     * @param maxCampaigns Maximum number of campaigns to process
     * @return processedCount Number of campaigns processed
     */
    function performMaintenanceOnExpiredCampaigns(
        uint256 maxCampaigns
    ) external returns (uint256 processedCount) {
        if (maxCampaigns > MAX_BATCH_SIZE) maxCampaigns = MAX_BATCH_SIZE;

        address[] memory allCampaigns = campaignFactory.getCampaigns();
        uint256 processed = 0;

        for (
            uint256 i = 0;
            i < allCampaigns.length && processed < maxCampaigns;
            i++
        ) {
            address campaign = allCampaigns[i];
            ICampaign campaignContract = ICampaign(campaign);
            ICampaign.CampaignInfo memory info = campaignContract
                .getCampaignInfo();
            bool isExpired = campaignContract.isDeadlinePassed();

            if (info.isActive && isExpired) {
                campaignContract.updateStatus();
                emit CampaignStatusUpdated(campaign, false, block.timestamp);
                processed++;
            }
        }

        emit BatchOperationCompleted(
            "performMaintenanceOnExpiredCampaigns",
            processed,
            block.timestamp
        );
        return processed;
    }

    // ============ Batch Operations ============

    /**
     * @dev Get multiple campaign lifecycle information in batch
     * @param campaigns Array of campaign addresses
     * @return isActive Array of active status for each campaign
     * @return isExpired Array of expired status for each campaign
     * @return timeRemaining Array of time remaining for each campaign
     * @return needsUpdate Array of update needed status for each campaign
     */
    function getBatchCampaignLifecycleInfo(
        address[] calldata campaigns
    )
        external
        view
        returns (
            bool[] memory isActive,
            bool[] memory isExpired,
            uint256[] memory timeRemaining,
            bool[] memory needsUpdate
        )
    {
        if (campaigns.length > MAX_BATCH_SIZE) revert BatchSizeExceeded();

        isActive = new bool[](campaigns.length);
        isExpired = new bool[](campaigns.length);
        timeRemaining = new uint256[](campaigns.length);
        needsUpdate = new bool[](campaigns.length);

        for (uint256 i = 0; i < campaigns.length; i++) {
            address campaign = campaigns[i];

            if (!campaignFactory.isCampaignRegistered(campaign)) {
                // Set default values for unregistered campaigns
                isActive[i] = false;
                isExpired[i] = true;
                timeRemaining[i] = 0;
                needsUpdate[i] = false;
                continue;
            }

            ICampaign campaignContract = ICampaign(campaign);
            ICampaign.CampaignInfo memory info = campaignContract
                .getCampaignInfo();

            isActive[i] = info.isActive;
            isExpired[i] = campaignContract.isDeadlinePassed();

            if (isExpired[i] || info.deadline <= block.timestamp) {
                timeRemaining[i] = 0;
            } else {
                timeRemaining[i] = info.deadline - block.timestamp;
            }

            needsUpdate[i] = isActive[i] && isExpired[i];
        }

        return (isActive, isExpired, timeRemaining, needsUpdate);
    }

    /**
     * @dev Check if multiple campaigns need status updates
     * @param campaigns Array of campaign addresses
     * @return Array of boolean values indicating which campaigns need updates
     */
    function batchNeedsStatusUpdate(
        address[] calldata campaigns
    ) external view returns (bool[] memory) {
        if (campaigns.length > MAX_BATCH_SIZE) revert BatchSizeExceeded();

        bool[] memory results = new bool[](campaigns.length);

        for (uint256 i = 0; i < campaigns.length; i++) {
            address campaign = campaigns[i];

            if (!campaignFactory.isCampaignRegistered(campaign)) {
                results[i] = false;
                continue;
            }

            ICampaign campaignContract = ICampaign(campaign);
            ICampaign.CampaignInfo memory info = campaignContract
                .getCampaignInfo();
            bool isExpired = campaignContract.isDeadlinePassed();

            results[i] = info.isActive && isExpired;
        }

        return results;
    }
}
