// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/ICampaign.sol";

interface IPrivacyManagerMinimal {
    function generateZeroAmount() external pure returns (bytes memory);

    function isUserRegistered(address user) external view returns (bool);

    function verifyDonationProof(
        address donor,
        address campaign,
        bytes memory encryptedAmount,
        bytes memory proof
    ) external view returns (bool);

    function verifyWithdrawalProof(
        address creator,
        address campaign,
        bytes memory encryptedAmount,
        bytes memory proof
    ) external view returns (bool);

    function addEncryptedAmounts(
        bytes memory a,
        bytes memory b
    ) external pure returns (bytes memory);
}

/**
 * @title Campaign
 * @dev Individual campaign contract with privacy-preserving functionality
 * This is a minimal implementation to support the CampaignFactory
 */
contract Campaign is ICampaign {
    // ============ State Variables ============

    Campaign private campaignData;
    IPrivacyManagerMinimal private privacyManager;
    bool private initialized;

    // ============ Modifiers ============

    modifier onlyCreator() {
        require(
            msg.sender == campaignData.creator,
            "Only creator can call this function"
        );
        _;
    }

    modifier onlyInitialized() {
        require(initialized, "Campaign not initialized");
        _;
    }

    modifier campaignActive() {
        require(campaignData.isActive, "Campaign is not active");
        require(!isDeadlinePassed(), "Campaign deadline has passed");
        _;
    }

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
    ) external {
        require(!initialized, "Already initialized");
        require(creator != address(0), "Invalid creator address");
        require(
            privacyManagerAddress != address(0),
            "Invalid privacy manager address"
        );

        campaignData = Campaign({
            creator: creator,
            title: title,
            description: description,
            encryptedGoal: encryptedGoal,
            encryptedRaised: new bytes(0),
            deadline: deadline,
            isActive: true
        });

        privacyManager = IPrivacyManagerMinimal(privacyManagerAddress);

        // Initialize with zero encrypted balance
        campaignData.encryptedRaised = privacyManager.generateZeroAmount();

        initialized = true;

        emit CampaignCreated(address(this), creator, title, deadline);
    }

    // ============ Core Functions ============

    /**
     * @dev Make a private donation to the campaign using encrypted tokens
     * @param encryptedAmount Encrypted donation amount using eERC20 encryption
     * @param proof Zero-knowledge proof for the donation
     */
    function donate(
        bytes memory encryptedAmount,
        bytes memory proof
    ) external onlyInitialized campaignActive {
        require(
            privacyManager.isUserRegistered(msg.sender),
            "Donor not registered"
        );

        // Verify donation proof
        bool isValidProof = privacyManager.verifyDonationProof(
            msg.sender,
            address(this),
            encryptedAmount,
            proof
        );
        require(isValidProof, "Invalid donation proof");

        // Update campaign balance using homomorphic addition
        campaignData.encryptedRaised = privacyManager.addEncryptedAmounts(
            campaignData.encryptedRaised,
            encryptedAmount
        );

        emit DonationMade(
            address(this),
            msg.sender,
            block.timestamp,
            keccak256(proof)
        );
    }

    /**
     * @dev Withdraw funds from the campaign (creator only)
     * @param proof Zero-knowledge proof for the withdrawal
     */
    function withdraw(bytes memory proof) external onlyInitialized onlyCreator {
        require(
            privacyManager.isUserRegistered(msg.sender),
            "Creator not registered"
        );

        // For this minimal implementation, we'll allow withdrawal of the full balance
        // In a complete implementation, this would support partial withdrawals

        // Verify withdrawal proof
        bool isValidProof = privacyManager.verifyWithdrawalProof(
            msg.sender,
            address(this),
            campaignData.encryptedRaised,
            proof
        );
        require(isValidProof, "Invalid withdrawal proof");

        // Reset the campaign balance to zero
        campaignData.encryptedRaised = privacyManager.generateZeroAmount();

        // Deactivate the campaign after withdrawal
        campaignData.isActive = false;

        emit FundsWithdrawn(
            address(this),
            msg.sender,
            block.timestamp,
            keccak256(proof)
        );

        emit CampaignStatusUpdated(address(this), false, block.timestamp);
    }

    // ============ View Functions ============

    /**
     * @dev Get public campaign information
     * @return CampaignInfo struct with public metadata
     */
    function getCampaignInfo()
        external
        view
        onlyInitialized
        returns (CampaignInfo memory)
    {
        return
            CampaignInfo({
                creator: campaignData.creator,
                title: campaignData.title,
                description: campaignData.description,
                deadline: campaignData.deadline,
                isActive: campaignData.isActive,
                encryptedGoal: campaignData.encryptedGoal
            });
    }

    /**
     * @dev Get encrypted balance of the campaign
     * @return Encrypted balance that can be decrypted by authorized parties
     */
    function getEncryptedBalance()
        external
        view
        onlyInitialized
        returns (bytes memory)
    {
        return campaignData.encryptedRaised;
    }

    /**
     * @dev Get encrypted goal of the campaign
     * @return Encrypted goal amount
     */
    function getEncryptedGoal()
        external
        view
        onlyInitialized
        returns (bytes memory)
    {
        return campaignData.encryptedGoal;
    }

    /**
     * @dev Check if the campaign deadline has passed
     * @return True if deadline has passed, false otherwise
     */
    function isDeadlinePassed() public view onlyInitialized returns (bool) {
        return block.timestamp > campaignData.deadline;
    }

    /**
     * @dev Get the campaign creator address
     * @return Address of the campaign creator
     */
    function getCreator() external view onlyInitialized returns (address) {
        return campaignData.creator;
    }

    // ============ Admin Functions ============

    /**
     * @dev Update campaign status (can be called by creator or when deadline passes)
     */
    function updateStatus() external onlyInitialized {
        bool shouldDeactivate = false;

        // Deactivate if deadline has passed
        if (isDeadlinePassed() && campaignData.isActive) {
            shouldDeactivate = true;
        }

        // Allow creator to deactivate manually
        if (msg.sender == campaignData.creator && campaignData.isActive) {
            shouldDeactivate = true;
        }

        if (shouldDeactivate) {
            campaignData.isActive = false;
            emit CampaignStatusUpdated(address(this), false, block.timestamp);
        }
    }
}
