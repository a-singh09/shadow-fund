// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SimpleCampaign.sol";

/**
 * @title SimpleCampaignFactory
 * @dev Factory contract for creating and managing simplified campaigns
 * Works with eERC20 integration through frontend SDK only
 * No custom encryption - leverages Avalanche's deployed eERC20 protocol
 */
contract SimpleCampaignFactory {
    // ============ Custom Errors ============

    error InvalidDeadline();
    error EmptyTitle();
    error CampaignNotFound();

    // ============ State Variables ============

    /// @dev Array of all campaign addresses
    address[] private allCampaigns;

    /// @dev Mapping from creator address to their campaign addresses
    mapping(address => address[]) private campaignsByCreator;

    /// @dev Mapping to check if a campaign is registered
    mapping(address => bool) private registeredCampaigns;

    /// @dev Counter for total campaigns created
    uint256 private totalCampaignsCreated;

    // ============ Events ============

    /**
     * @dev Emitted when a new campaign is created
     * @param campaignAddress Address of the newly created campaign contract
     * @param creator Address of the campaign creator
     * @param title Campaign title
     * @param deadline Campaign deadline timestamp
     */
    event CampaignCreated(
        address indexed campaignAddress,
        address indexed creator,
        string title,
        uint256 deadline
    );

    // ============ Core Functions ============

    /**
     * @dev Create a new campaign with public metadata
     * @param title Campaign title (public metadata)
     * @param description Campaign description (public metadata)
     * @param deadline Campaign deadline timestamp
     * @return campaignAddress Address of the newly created campaign contract
     */
    function createCampaign(
        string memory title,
        string memory description,
        uint256 deadline
    ) external returns (address campaignAddress) {
        // Validate inputs
        if (bytes(title).length == 0) revert EmptyTitle();
        if (deadline <= block.timestamp) revert InvalidDeadline();

        // Deploy new SimpleCampaign contract
        SimpleCampaign campaign = new SimpleCampaign(
            msg.sender,
            title,
            description,
            deadline
        );

        campaignAddress = address(campaign);

        // Register the campaign
        _registerCampaign(campaignAddress, msg.sender);

        emit CampaignCreated(campaignAddress, msg.sender, title, deadline);

        return campaignAddress;
    }

    /**
     * @dev Get all campaign addresses
     * @return Array of campaign contract addresses
     */
    function getCampaigns() external view returns (address[] memory) {
        return allCampaigns;
    }

    /**
     * @dev Get campaigns created by a specific address
     * @param creator Address of the campaign creator
     * @return Array of campaign contract addresses created by the specified creator
     */
    function getCampaignsByCreator(
        address creator
    ) external view returns (address[] memory) {
        return campaignsByCreator[creator];
    }

    /**
     * @dev Get active campaigns
     * @return Array of active campaign contract addresses
     */
    function getActiveCampaigns() external view returns (address[] memory) {
        uint256 activeCount = 0;

        // First pass: count active campaigns
        for (uint256 i = 0; i < allCampaigns.length; i++) {
            SimpleCampaign.CampaignInfo memory info = SimpleCampaign(
                allCampaigns[i]
            ).getCampaignInfo();
            if (
                info.isActive &&
                !SimpleCampaign(allCampaigns[i]).isDeadlinePassed()
            ) {
                activeCount++;
            }
        }

        // Second pass: populate active campaigns array
        address[] memory activeCampaigns = new address[](activeCount);
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < allCampaigns.length; i++) {
            SimpleCampaign.CampaignInfo memory info = SimpleCampaign(
                allCampaigns[i]
            ).getCampaignInfo();
            if (
                info.isActive &&
                !SimpleCampaign(allCampaigns[i]).isDeadlinePassed()
            ) {
                activeCampaigns[currentIndex] = allCampaigns[i];
                currentIndex++;
            }
        }

        return activeCampaigns;
    }

    /**
     * @dev Get campaigns by status (active or inactive)
     * @param isActive Filter by active status
     * @return Array of campaign addresses matching the status
     */
    function getCampaignsByStatus(
        bool isActive
    ) external view returns (address[] memory) {
        uint256 matchingCount = 0;

        // First pass: count matching campaigns
        for (uint256 i = 0; i < allCampaigns.length; i++) {
            SimpleCampaign.CampaignInfo memory info = SimpleCampaign(
                allCampaigns[i]
            ).getCampaignInfo();
            bool campaignActive = info.isActive &&
                !SimpleCampaign(allCampaigns[i]).isDeadlinePassed();
            if (campaignActive == isActive) {
                matchingCount++;
            }
        }

        // Second pass: populate matching campaigns array
        address[] memory matchingCampaigns = new address[](matchingCount);
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < allCampaigns.length; i++) {
            SimpleCampaign.CampaignInfo memory info = SimpleCampaign(
                allCampaigns[i]
            ).getCampaignInfo();
            bool campaignActive = info.isActive &&
                !SimpleCampaign(allCampaigns[i]).isDeadlinePassed();
            if (campaignActive == isActive) {
                matchingCampaigns[currentIndex] = allCampaigns[i];
                currentIndex++;
            }
        }

        return matchingCampaigns;
    }

    /**
     * @dev Get total number of campaigns
     * @return Total number of campaigns created
     */
    function getCampaignCount() external view returns (uint256) {
        return totalCampaignsCreated;
    }

    /**
     * @dev Check if a campaign is registered with the factory
     * @param campaignAddress Address of the campaign contract
     * @return True if the campaign is registered, false otherwise
     */
    function isCampaignRegistered(
        address campaignAddress
    ) external view returns (bool) {
        return registeredCampaigns[campaignAddress];
    }

    /**
     * @dev Get campaign statistics
     * @return totalCampaigns Total number of campaigns
     * @return activeCampaigns Number of currently active campaigns
     */
    function getCampaignStats()
        external
        view
        returns (uint256 totalCampaigns, uint256 activeCampaigns)
    {
        totalCampaigns = totalCampaignsCreated;

        uint256 activeCount = 0;
        for (uint256 i = 0; i < allCampaigns.length; i++) {
            SimpleCampaign.CampaignInfo memory info = SimpleCampaign(
                allCampaigns[i]
            ).getCampaignInfo();
            if (
                info.isActive &&
                !SimpleCampaign(allCampaigns[i]).isDeadlinePassed()
            ) {
                activeCount++;
            }
        }

        activeCampaigns = activeCount;
    }

    /**
     * @dev Get campaign information for multiple campaigns in batch
     * @param campaignAddresses Array of campaign addresses to query
     * @return campaignInfos Array of CampaignInfo structs
     */
    function getCampaignInfoBatch(
        address[] calldata campaignAddresses
    )
        external
        view
        returns (SimpleCampaign.CampaignInfo[] memory campaignInfos)
    {
        campaignInfos = new SimpleCampaign.CampaignInfo[](
            campaignAddresses.length
        );

        for (uint256 i = 0; i < campaignAddresses.length; i++) {
            if (registeredCampaigns[campaignAddresses[i]]) {
                campaignInfos[i] = SimpleCampaign(campaignAddresses[i])
                    .getCampaignInfo();
            }
            // If campaign is not registered, the struct will have default values
        }

        return campaignInfos;
    }

    /**
     * @dev Get campaigns with pagination support
     * @param offset Starting index for pagination
     * @param limit Maximum number of campaigns to return
     * @return campaigns Array of campaign addresses
     * @return hasMore True if there are more campaigns beyond this page
     */
    function getCampaignsPaginated(
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory campaigns, bool hasMore) {
        uint256 totalCampaigns = allCampaigns.length;

        if (offset >= totalCampaigns) {
            return (new address[](0), false);
        }

        uint256 end = offset + limit;
        if (end > totalCampaigns) {
            end = totalCampaigns;
        }

        uint256 resultLength = end - offset;
        campaigns = new address[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            campaigns[i] = allCampaigns[offset + i];
        }

        hasMore = end < totalCampaigns;

        return (campaigns, hasMore);
    }

    // ============ Internal Functions ============

    /**
     * @dev Register a new campaign in the factory
     * @param campaignAddress Address of the campaign contract
     * @param creator Address of the campaign creator
     */
    function _registerCampaign(
        address campaignAddress,
        address creator
    ) internal {
        // Add to all campaigns array
        allCampaigns.push(campaignAddress);

        // Add to creator's campaigns
        campaignsByCreator[creator].push(campaignAddress);

        // Mark as registered
        registeredCampaigns[campaignAddress] = true;

        // Increment counter
        totalCampaignsCreated++;
    }
}
