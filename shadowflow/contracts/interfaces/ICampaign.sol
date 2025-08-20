// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ICampaign
 * @dev Interface for individual campaign contracts with privacy-preserving functionality
 */
interface ICampaign {
    // ============ Data Structures ============

    /**
     * @dev Campaign struct with encrypted goal and balance fields
     * @param creator Address of the campaign creator
     * @param title Campaign title (public metadata)
     * @param description Campaign description (public metadata)
     * @param encryptedGoal Encrypted target amount using eERC20 encryption
     * @param encryptedRaised Encrypted current raised amount
     * @param deadline Campaign deadline timestamp
     * @param isActive Whether the campaign is currently active
     */
    struct Campaign {
        address creator;
        string title;
        string description;
        bytes encryptedGoal;
        bytes encryptedRaised;
        uint256 deadline;
        bool isActive;
    }

    /**
     * @dev CampaignInfo struct for public metadata queries
     * @param creator Address of the campaign creator
     * @param title Campaign title
     * @param description Campaign description
     * @param deadline Campaign deadline timestamp
     * @param isActive Whether the campaign is currently active
     * @param encryptedGoal Encrypted target amount (viewable by authorized parties)
     */
    struct CampaignInfo {
        address creator;
        string title;
        string description;
        uint256 deadline;
        bool isActive;
        bytes encryptedGoal;
    }

    // ============ Events ============

    /**
     * @dev Emitted when a campaign is created
     * @param campaignId Unique identifier for the campaign
     * @param creator Address of the campaign creator
     * @param title Campaign title
     * @param deadline Campaign deadline timestamp
     */
    event CampaignCreated(
        address indexed campaignId,
        address indexed creator,
        string title,
        uint256 deadline
    );

    /**
     * @dev Emitted when a donation is made to the campaign
     * @param campaign Address of the campaign contract
     * @param donor Address of the donor
     * @param timestamp When the donation was made
     * @param proofHash Hash of the zero-knowledge proof for verification
     */
    event DonationMade(
        address indexed campaign,
        address indexed donor,
        uint256 timestamp,
        bytes32 proofHash
    );

    /**
     * @dev Emitted when funds are withdrawn from the campaign
     * @param campaign Address of the campaign contract
     * @param creator Address of the campaign creator
     * @param encryptedAmount Encrypted amount withdrawn (maintains privacy)
     * @param timestamp When the withdrawal was made
     * @param proofHash Hash of the withdrawal proof
     */
    event FundsWithdrawn(
        address indexed campaign,
        address indexed creator,
        bytes encryptedAmount,
        uint256 timestamp,
        bytes32 proofHash
    );

    /**
     * @dev Emitted when campaign status is updated
     * @param campaign Address of the campaign contract
     * @param isActive New active status
     * @param timestamp When the status was updated
     */
    event CampaignStatusUpdated(
        address indexed campaign,
        bool isActive,
        uint256 timestamp
    );

    // ============ Initialization ============

    /**
     * @dev Initialize the campaign (called by factory)
     * @param creator Address of the campaign creator
     * @param title Campaign title
     * @param description Campaign description
     * @param encryptedGoal Encrypted target amount
     * @param deadline Campaign deadline timestamp
     * @param privacyManagerAddress Address of the privacy manager
     */
    function initialize(
        address creator,
        string memory title,
        string memory description,
        bytes memory encryptedGoal,
        uint256 deadline,
        address privacyManagerAddress
    ) external;

    // ============ Core Functions ============

    /**
     * @dev Make a private donation to the campaign using encrypted tokens
     * @param encryptedAmount Encrypted donation amount using eERC20 encryption
     * @param proof Zero-knowledge proof for the donation
     */
    function donate(bytes memory encryptedAmount, bytes memory proof) external;

    /**
     * @dev Withdraw funds from the campaign (creator only)
     * @param proof Zero-knowledge proof for the withdrawal
     */
    function withdraw(bytes memory proof) external;

    /**
     * @dev Get public campaign information
     * @return CampaignInfo struct with public metadata
     */
    function getCampaignInfo() external view returns (CampaignInfo memory);

    /**
     * @dev Get encrypted balance of the campaign
     * @return Encrypted balance that can be decrypted by authorized parties
     */
    function getEncryptedBalance() external view returns (bytes memory);

    /**
     * @dev Get encrypted goal of the campaign
     * @return Encrypted goal amount
     */
    function getEncryptedGoal() external view returns (bytes memory);

    /**
     * @dev Check if the campaign deadline has passed
     * @return True if deadline has passed, false otherwise
     */
    function isDeadlinePassed() external view returns (bool);

    /**
     * @dev Get the campaign creator address
     * @return Address of the campaign creator
     */
    function getCreator() external view returns (address);

    /**
     * @dev Update campaign status (can be called by creator or when deadline passes)
     */
    function updateStatus() external;
}
