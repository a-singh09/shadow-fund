// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/ICampaignFactory.sol";
import "./interfaces/ICampaign.sol";
import "./interfaces/IPrivacyManager.sol";
import "lib/openzeppelin-contracts/contracts/proxy/Clones.sol";
import "lib/openzeppelin-contracts/contracts/access/Ownable.sol";

/**
 * @title CampaignFactory
 * @dev Factory contract for creating and managing privacy-preserving campaigns
 * Uses minimal proxy pattern for gas-efficient campaign deployment
 */
contract CampaignFactory is ICampaignFactory, Ownable {
    using Clones for address;

    // ============ State Variables ============

    /// @dev Template campaign contract for cloning
    address public immutable campaignTemplate;

    /// @dev Privacy manager for eERC20 integration
    IPrivacyManager public immutable privacyManager;

    /// @dev Array of all campaign addresses
    address[] private allCampaigns;

    /// @dev Mapping from creator address to their campaign addresses
    mapping(address => address[]) private campaignsByCreator;

    /// @dev Mapping to check if a campaign is registered
    mapping(address => bool) private registeredCampaigns;

    /// @dev Mapping from campaign address to its index in allCampaigns array
    mapping(address => uint256) private campaignIndex;

    /// @dev Counter for total campaigns created
    uint256 private totalCampaignsCreated;

    // ============ Custom Errors ============

    error InvalidDeadline();
    error EmptyTitle();
    error InvalidGoal();
    error CampaignNotRegistered();
    error UserNotRegistered();
    error InvalidCampaignTemplate();
    error InvalidPrivacyManager();

    // ============ Constructor ============

    /**
     * @dev Initialize the campaign factory
     * @param _campaignTemplate Address of the campaign template contract
     * @param _privacyManager Address of the privacy manager contract
     */
    constructor(
        address _campaignTemplate,
        address _privacyManager
    ) Ownable(msg.sender) {
        if (_campaignTemplate == address(0)) revert InvalidCampaignTemplate();
        if (_privacyManager == address(0)) revert InvalidPrivacyManager();

        campaignTemplate = _campaignTemplate;
        privacyManager = IPrivacyManager(_privacyManager);
    }

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
    ) external returns (address campaignAddress) {
        // Validate inputs
        if (bytes(title).length == 0) revert EmptyTitle();
        if (deadline <= block.timestamp) revert InvalidDeadline();
        if (!privacyManager.isUserRegistered(msg.sender))
            revert UserNotRegistered();
        if (!_validateEncryptedGoal(encryptedGoal)) revert InvalidGoal();

        // Clone the campaign template
        campaignAddress = campaignTemplate.clone();

        // Initialize the campaign
        ICampaign(campaignAddress).initialize(
            msg.sender,
            title,
            description,
            encryptedGoal,
            deadline,
            address(privacyManager)
        );

        // Register the campaign
        _registerCampaign(campaignAddress, msg.sender);

        // Authorize the campaign with privacy manager
        privacyManager.authorizeCampaign(campaignAddress);

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
            ICampaign.CampaignInfo memory info = ICampaign(allCampaigns[i])
                .getCampaignInfo();
            if (
                info.isActive && !ICampaign(allCampaigns[i]).isDeadlinePassed()
            ) {
                activeCount++;
            }
        }

        // Second pass: populate active campaigns array
        address[] memory activeCampaigns = new address[](activeCount);
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < allCampaigns.length; i++) {
            ICampaign.CampaignInfo memory info = ICampaign(allCampaigns[i])
                .getCampaignInfo();
            if (
                info.isActive && !ICampaign(allCampaigns[i]).isDeadlinePassed()
            ) {
                activeCampaigns[currentIndex] = allCampaigns[i];
                currentIndex++;
            }
        }

        return activeCampaigns;
    }

    /**
     * @dev Get total number of campaigns
     * @return Total number of campaigns created
     */
    function getTotalCampaigns() external view returns (uint256) {
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
        campaignIndex[campaignAddress] = allCampaigns.length - 1;

        // Add to creator's campaigns
        campaignsByCreator[creator].push(campaignAddress);

        // Mark as registered
        registeredCampaigns[campaignAddress] = true;

        // Increment counter
        totalCampaignsCreated++;

        emit CampaignRegistered(campaignAddress, creator);
    }

    /**
     * @dev Validate encrypted goal format and content
     * @param encryptedGoal The encrypted goal to validate
     * @return bool indicating if the encrypted goal is valid
     */
    function _validateEncryptedGoal(
        bytes memory encryptedGoal
    ) internal view returns (bool) {
        // Check if encrypted goal has valid format
        if (!privacyManager.isValidEncryptedAmount(encryptedGoal)) {
            return false;
        }

        // Additional validation: encrypted goal should not be zero
        bytes memory zeroAmount = privacyManager.generateZeroAmount();
        if (keccak256(encryptedGoal) == keccak256(zeroAmount)) {
            return false;
        }

        return true;
    }

    // ============ Admin Functions ============

    /**
     * @dev Update campaign template (owner only)
     * @param newTemplate Address of the new campaign template
     */
    function updateCampaignTemplate(address newTemplate) external onlyOwner {
        if (newTemplate == address(0)) revert InvalidCampaignTemplate();
        // Note: This would require a new factory deployment in practice
        // as campaignTemplate is immutable
    }

    /**
     * @dev Emergency function to remove a campaign from registry (owner only)
     * @param campaignAddress Address of the campaign to remove
     */
    function removeCampaign(address campaignAddress) external onlyOwner {
        if (!registeredCampaigns[campaignAddress])
            revert CampaignNotRegistered();

        // Get campaign info to find creator
        ICampaign.CampaignInfo memory info = ICampaign(campaignAddress)
            .getCampaignInfo();
        address creator = info.creator;

        // Remove from all campaigns array
        uint256 index = campaignIndex[campaignAddress];
        uint256 lastIndex = allCampaigns.length - 1;

        if (index != lastIndex) {
            address lastCampaign = allCampaigns[lastIndex];
            allCampaigns[index] = lastCampaign;
            campaignIndex[lastCampaign] = index;
        }

        allCampaigns.pop();
        delete campaignIndex[campaignAddress];

        // Remove from creator's campaigns
        address[] storage creatorCampaigns = campaignsByCreator[creator];
        for (uint256 i = 0; i < creatorCampaigns.length; i++) {
            if (creatorCampaigns[i] == campaignAddress) {
                creatorCampaigns[i] = creatorCampaigns[
                    creatorCampaigns.length - 1
                ];
                creatorCampaigns.pop();
                break;
            }
        }

        // Mark as unregistered
        registeredCampaigns[campaignAddress] = false;

        // Revoke privacy manager authorization
        privacyManager.revokeCampaign(campaignAddress);
    }

    // ============ View Functions ============

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
            ICampaign.CampaignInfo memory info = ICampaign(allCampaigns[i])
                .getCampaignInfo();
            if (
                info.isActive && !ICampaign(allCampaigns[i]).isDeadlinePassed()
            ) {
                activeCount++;
            }
        }

        activeCampaigns = activeCount;
    }

    /**
     * @dev Get campaigns by status
     * @param isActive Filter by active status
     * @return Array of campaign addresses matching the status
     */
    function getCampaignsByStatus(
        bool isActive
    ) external view returns (address[] memory) {
        uint256 matchingCount = 0;

        // First pass: count matching campaigns
        for (uint256 i = 0; i < allCampaigns.length; i++) {
            ICampaign.CampaignInfo memory info = ICampaign(allCampaigns[i])
                .getCampaignInfo();
            bool campaignActive = info.isActive &&
                !ICampaign(allCampaigns[i]).isDeadlinePassed();
            if (campaignActive == isActive) {
                matchingCount++;
            }
        }

        // Second pass: populate matching campaigns array
        address[] memory matchingCampaigns = new address[](matchingCount);
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < allCampaigns.length; i++) {
            ICampaign.CampaignInfo memory info = ICampaign(allCampaigns[i])
                .getCampaignInfo();
            bool campaignActive = info.isActive &&
                !ICampaign(allCampaigns[i]).isDeadlinePassed();
            if (campaignActive == isActive) {
                matchingCampaigns[currentIndex] = allCampaigns[i];
                currentIndex++;
            }
        }

        return matchingCampaigns;
    }
}
