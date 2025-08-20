// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ICampaignManager
 * @dev Interface for campaign utility and lifecycle management functions
 * Provides deadline checking, status updates, statistics, and batch operations
 */
interface ICampaignManager {
    // ============ Events ============

    /// @dev Emitted when campaign status is updated
    event CampaignStatusUpdated(
        address indexed campaign,
        bool isActive,
        uint256 timestamp
    );

    /// @dev Emitted when batch operation is completed
    event BatchOperationCompleted(
        string operation,
        uint256 processedCount,
        uint256 timestamp
    );

    // ============ Status Management Functions ============

    /**
     * @dev Check if a campaign's deadline has passed
     * @param campaign Address of the campaign contract
     * @return True if deadline has passed, false otherwise
     */
    function isDeadlinePassed(address campaign) external view returns (bool);

    /**
     * @dev Update the status of a specific campaign
     * @param campaign Address of the campaign contract to update
     */
    function updateCampaignStatus(address campaign) external;

    /**
     * @dev Update status for multiple campaigns in batch
     * @param campaigns Array of campaign addresses to update
     */
    function batchUpdateCampaignStatus(address[] calldata campaigns) external;

    /**
     * @dev Update status for all campaigns (with pagination)
     * @param startIndex Starting index for batch processing
     * @param batchSize Number of campaigns to process in this batch
     */
    function updateAllCampaignStatuses(
        uint256 startIndex,
        uint256 batchSize
    ) external;

    // ============ Statistics and Analytics Functions ============

    /**
     * @dev Get overall campaign statistics
     * @return totalCampaigns Total number of campaigns created
     * @return activeCampaigns Number of currently active campaigns
     */
    function getCampaignStats()
        external
        view
        returns (uint256 totalCampaigns, uint256 activeCampaigns);

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
        );

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
    ) external view returns (address[] memory campaigns, bool hasMore);

    /**
     * @dev Get campaigns expiring within a specific timeframe
     * @param timeframe Time in seconds from now
     * @return Array of campaign addresses expiring within the timeframe
     */
    function getCampaignsExpiringWithin(
        uint256 timeframe
    ) external view returns (address[] memory);

    // ============ Lifecycle Management Functions ============

    /**
     * @dev Check if a campaign needs status update
     * @param campaign Address of the campaign contract
     * @return True if campaign needs status update, false otherwise
     */
    function needsStatusUpdate(address campaign) external view returns (bool);

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
        );

    /**
     * @dev Perform maintenance on expired campaigns
     * @param maxCampaigns Maximum number of campaigns to process
     * @return processedCount Number of campaigns processed
     */
    function performMaintenanceOnExpiredCampaigns(
        uint256 maxCampaigns
    ) external returns (uint256 processedCount);

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
        );

    /**
     * @dev Check if multiple campaigns need status updates
     * @param campaigns Array of campaign addresses
     * @return Array of boolean values indicating which campaigns need updates
     */
    function batchNeedsStatusUpdate(
        address[] calldata campaigns
    ) external view returns (bool[] memory);
}
