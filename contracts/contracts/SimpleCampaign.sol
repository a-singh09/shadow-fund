// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SimpleCampaign
 * @dev Minimal campaign contract that works with eERC20 transfers
 * No token handling - just metadata and transaction hash tracking
 * Integrates with Avalanche's deployed eERC20 protocol via frontend SDK
 */
contract SimpleCampaign {
    // ============ Custom Errors ============

    error InvalidCreator();
    error EmptyTitle();
    error InvalidDeadline();
    error Unauthorized();
    error DonationAlreadyRegistered();
    error WithdrawalAlreadyRegistered();
    error CampaignInactive();

    // ============ State Variables ============

    address public creator;
    string public title;
    string public description;
    uint256 public deadline;
    bool public isActive;

    // Track donations by eERC20 transaction hash
    mapping(bytes32 => DonationInfo) public donations;
    bytes32[] public donationHashes;

    // Track withdrawals by eERC20 transaction hash
    mapping(bytes32 => WithdrawalInfo) public withdrawals;
    bytes32[] public withdrawalHashes;

    // ============ Structs ============

    struct DonationInfo {
        address donor;
        uint256 timestamp;
        bool exists;
    }

    struct WithdrawalInfo {
        uint256 timestamp;
        bool exists;
    }

    struct CampaignInfo {
        address creator;
        string title;
        string description;
        uint256 deadline;
        bool isActive;
        uint256 donationCount;
        uint256 withdrawalCount;
    }

    // ============ Events ============

    event CampaignCreated(
        address indexed creator,
        string title,
        uint256 deadline
    );

    event DonationRegistered(
        bytes32 indexed txHash,
        address indexed donor,
        uint256 timestamp
    );

    event WithdrawalRegistered(bytes32 indexed txHash, uint256 timestamp);

    event CampaignStatusUpdated(bool isActive);

    // ============ Modifiers ============

    modifier onlyCreator() {
        if (msg.sender != creator) revert Unauthorized();
        _;
    }

    modifier campaignActive() {
        if (!isActive) revert CampaignInactive();
        if (block.timestamp > deadline) revert CampaignInactive();
        _;
    }

    // ============ Constructor ============

    constructor(
        address _creator,
        string memory _title,
        string memory _description,
        uint256 _deadline
    ) {
        if (_creator == address(0)) revert InvalidCreator();
        if (bytes(_title).length == 0) revert EmptyTitle();
        if (_deadline <= block.timestamp) revert InvalidDeadline();

        creator = _creator;
        title = _title;
        description = _description;
        deadline = _deadline;
        isActive = true;

        emit CampaignCreated(_creator, _title, _deadline);
    }

    // ============ Core Functions ============

    /**
     * @dev Register a donation made through eERC20 privateTransfer
     * Links eERC20 transaction hash to this campaign for tracking
     * @param txHash Transaction hash of the eERC20 privateTransfer
     */
    function registerDonation(bytes32 txHash) external campaignActive {
        if (donations[txHash].exists) revert DonationAlreadyRegistered();

        donations[txHash] = DonationInfo({
            donor: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });

        donationHashes.push(txHash);

        emit DonationRegistered(txHash, msg.sender, block.timestamp);
    }

    /**
     * @dev Register a withdrawal made through eERC20 privateTransfer
     * Only campaign creator can register withdrawals
     * @param txHash Transaction hash of the eERC20 privateTransfer
     */
    function registerWithdrawal(bytes32 txHash) external onlyCreator {
        if (withdrawals[txHash].exists) revert WithdrawalAlreadyRegistered();

        withdrawals[txHash] = WithdrawalInfo({
            timestamp: block.timestamp,
            exists: true
        });

        withdrawalHashes.push(txHash);

        emit WithdrawalRegistered(txHash, block.timestamp);
    }

    // ============ View Functions ============

    /**
     * @dev Get comprehensive campaign information
     * @return CampaignInfo struct with all public metadata and statistics
     */
    function getCampaignInfo() external view returns (CampaignInfo memory) {
        return
            CampaignInfo({
                creator: creator,
                title: title,
                description: description,
                deadline: deadline,
                isActive: isActive,
                donationCount: donationHashes.length,
                withdrawalCount: withdrawalHashes.length
            });
    }

    /**
     * @dev Get all donation transaction hashes
     * @return Array of eERC20 transaction hashes for donations
     */
    function getDonationHashes() external view returns (bytes32[] memory) {
        return donationHashes;
    }

    /**
     * @dev Get all withdrawal transaction hashes
     * @return Array of eERC20 transaction hashes for withdrawals
     */
    function getWithdrawalHashes() external view returns (bytes32[] memory) {
        return withdrawalHashes;
    }

    /**
     * @dev Get donation information by transaction hash
     * @param txHash The eERC20 transaction hash
     * @return DonationInfo struct with donor and timestamp
     */
    function getDonationInfo(
        bytes32 txHash
    ) external view returns (DonationInfo memory) {
        return donations[txHash];
    }

    /**
     * @dev Get withdrawal information by transaction hash
     * @param txHash The eERC20 transaction hash
     * @return WithdrawalInfo struct with timestamp
     */
    function getWithdrawalInfo(
        bytes32 txHash
    ) external view returns (WithdrawalInfo memory) {
        return withdrawals[txHash];
    }

    /**
     * @dev Check if deadline has passed
     * @return True if current time is past the deadline
     */
    function isDeadlinePassed() public view returns (bool) {
        return block.timestamp > deadline;
    }

    /**
     * @dev Get donation count
     * @return Number of registered donations
     */
    function getDonationCount() external view returns (uint256) {
        return donationHashes.length;
    }

    /**
     * @dev Get withdrawal count
     * @return Number of registered withdrawals
     */
    function getWithdrawalCount() external view returns (uint256) {
        return withdrawalHashes.length;
    }

    // ============ Admin Functions ============

    /**
     * @dev Update campaign status
     * Auto-deactivates if deadline passed or allows creator to deactivate manually
     */
    function updateStatus() external {
        bool shouldDeactivate = false;

        // Auto-deactivate if deadline passed
        if (isDeadlinePassed() && isActive) {
            shouldDeactivate = true;
        }

        // Allow creator to deactivate manually
        if (msg.sender == creator && isActive) {
            shouldDeactivate = true;
        }

        if (shouldDeactivate) {
            isActive = false;
            emit CampaignStatusUpdated(false);
        }
    }
}
