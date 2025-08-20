// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ICampaignFactory
 * @dev Interface for the campaign factory contract that deploys and manages campaigns
 */
interface ICampaignFactory {
    // ============ Events ============

    /**
     * @dev Emitted when a new campaign is created through the factory
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

    /**
     * @dev Emitted when a campaign is registered in the factory
     * @param campaignAddress Address of the campaign contract
     * @param creator Address of the campaign creator
     */
    event CampaignRegistered(
        address indexed campaignAddress,
        address indexed creator
    );

    // ============ Core Functions ============

    /**
     * @dev Create a new campaign with encrypted goal
     * @param title Campaign title (public metadata)
     * @param description Campaign description (public metadata)
     * @param encryptedGoal Encrypted target amount using eERC20 encryption
     * @param deadline Campaign deadline timestamp
     * @return campaignAddress Address of the newly created campaign contract
     */
    function createCampaign(
        string memory title,
        string memory description,
        bytes memory encryptedGoal,
        uint256 deadline
    ) external returns (address campaignAddress);

    /**
     * @dev Get all campaign addresses
     * @return Array of campaign contract addresses
     */
    function getCampaigns() external view returns (address[] memory);

    /**
     * @dev Get campaigns created by a specific address
     * @param creator Address of the campaign creator
     * @return Array of campaign contract addresses created by the specified creator
     */
    function getCampaignsByCreator(
        address creator
    ) external view returns (address[] memory);

    /**
     * @dev Get active campaigns
     * @return Array of active campaign contract addresses
     */
    function getActiveCampaigns() external view returns (address[] memory);

    /**
     * @dev Get total number of campaigns
     * @return Total number of campaigns created
     */
    function getTotalCampaigns() external view returns (uint256);

    /**
     * @dev Check if a campaign is registered with the factory
     * @param campaignAddress Address of the campaign contract
     * @return True if the campaign is registered, false otherwise
     */
    function isCampaignRegistered(
        address campaignAddress
    ) external view returns (bool);

    /**
     * @dev Get campaign statistics
     * @return totalCampaigns Total number of campaigns
     * @return activeCampaigns Number of currently active campaigns
     */
    function getCampaignStats()
        external
        view
        returns (uint256 totalCampaigns, uint256 activeCampaigns);
}
