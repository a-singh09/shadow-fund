// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/ICampaign.sol";
import "./interfaces/IPrivacyManager.sol";
import "./interfaces/IEERC20.sol";

/**
 * @title Campaign
 * @dev Individual campaign contract with privacy-preserving functionality
 * Implements core campaign functionality with encrypted donations and withdrawals
 */
contract Campaign is ICampaign {
    // ============ State Variables ============

    Campaign private campaignData;
    IPrivacyManager private privacyManager;
    IEERC20 private eerc20Token;
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

    modifier validEncryptedAmount(bytes memory encryptedAmount) {
        require(encryptedAmount.length > 0, "Invalid encrypted amount");
        require(
            privacyManager.isValidEncryptedAmount(encryptedAmount),
            "Malformed encrypted amount"
        );
        _;
    }

    modifier validProof(bytes memory proof) {
        require(proof.length > 0, "Invalid proof");
        require(privacyManager.validateProofFormat(proof), "Malformed proof");
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
        require(bytes(title).length > 0, "Title cannot be empty");
        require(deadline > block.timestamp, "Deadline must be in the future");
        require(encryptedGoal.length > 0, "Invalid encrypted goal");

        campaignData = Campaign({
            creator: creator,
            title: title,
            description: description,
            encryptedGoal: encryptedGoal,
            encryptedRaised: new bytes(0),
            deadline: deadline,
            isActive: true
        });

        privacyManager = IPrivacyManager(privacyManagerAddress);

        // Initialize with zero encrypted balance
        campaignData.encryptedRaised = privacyManager.generateZeroAmount();

        initialized = true;

        emit CampaignCreated(address(this), creator, title, deadline);
    }

    /**
     * @dev Set the eERC20 token contract address (called by factory after initialization)
     * @param tokenAddress Address of the eERC20 token contract
     */
    function setEERC20Token(address tokenAddress) external {
        require(initialized, "Campaign not initialized");
        require(tokenAddress != address(0), "Invalid token address");
        require(address(eerc20Token) == address(0), "Token already set");

        eerc20Token = IEERC20(tokenAddress);
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
    )
        external
        onlyInitialized
        campaignActive
        validEncryptedAmount(encryptedAmount)
        validProof(proof)
    {
        require(address(eerc20Token) != address(0), "eERC20 token not set");
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

        // Transfer eERC20 tokens from donor to campaign
        bool transferSuccess = eerc20Token.transferFrom(
            msg.sender,
            address(this),
            encryptedAmount,
            proof
        );
        require(transferSuccess, "Token transfer failed");

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
    function withdraw(
        bytes memory proof
    ) external onlyInitialized onlyCreator validProof(proof) {
        require(address(eerc20Token) != address(0), "eERC20 token not set");
        require(
            privacyManager.isUserRegistered(msg.sender),
            "Creator not registered"
        );
        require(
            campaignData.encryptedRaised.length > 0,
            "No funds to withdraw"
        );

        // For full withdrawal, we use the current campaign balance
        bytes memory withdrawalAmount = campaignData.encryptedRaised;

        // Verify withdrawal proof with the current balance
        bool isValidProof = privacyManager.verifyWithdrawalProof(
            msg.sender,
            address(this),
            withdrawalAmount,
            proof
        );
        require(isValidProof, "Invalid withdrawal proof");

        // Transfer eERC20 tokens from campaign to creator
        bool transferSuccess = eerc20Token.transfer(
            msg.sender,
            withdrawalAmount,
            proof
        );
        require(transferSuccess, "Token transfer failed");

        // Reset campaign balance to zero after withdrawal
        campaignData.encryptedRaised = privacyManager.generateZeroAmount();

        emit FundsWithdrawn(
            address(this),
            msg.sender,
            withdrawalAmount,
            block.timestamp,
            keccak256(proof)
        );
    }

    /**
     * @dev Withdraw a specific amount from the campaign (creator only)
     * @param encryptedAmount Encrypted amount to withdraw (for partial withdrawals)
     * @param proof Zero-knowledge proof for the withdrawal
     */
    function withdrawAmount(
        bytes memory encryptedAmount,
        bytes memory proof
    )
        external
        onlyInitialized
        onlyCreator
        validEncryptedAmount(encryptedAmount)
        validProof(proof)
    {
        require(address(eerc20Token) != address(0), "eERC20 token not set");
        require(
            privacyManager.isUserRegistered(msg.sender),
            "Creator not registered"
        );
        require(
            campaignData.encryptedRaised.length > 0,
            "No funds to withdraw"
        );

        // Verify withdrawal proof with the specific amount
        bool isValidProof = privacyManager.verifyWithdrawalProof(
            msg.sender,
            address(this),
            encryptedAmount,
            proof
        );
        require(isValidProof, "Invalid withdrawal proof");

        // Transfer eERC20 tokens from campaign to creator
        bool transferSuccess = eerc20Token.transfer(
            msg.sender,
            encryptedAmount,
            proof
        );
        require(transferSuccess, "Token transfer failed");

        // Update campaign balance by subtracting the withdrawal amount
        campaignData.encryptedRaised = privacyManager.subtractEncryptedAmounts(
            campaignData.encryptedRaised,
            encryptedAmount
        );

        emit FundsWithdrawn(
            address(this),
            msg.sender,
            encryptedAmount,
            block.timestamp,
            keccak256(proof)
        );
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

    /**
     * @dev Get the eERC20 token contract address
     * @return Address of the eERC20 token contract
     */
    function getTokenAddress() external view onlyInitialized returns (address) {
        return address(eerc20Token);
    }

    /**
     * @dev Check if the campaign has funds available
     * @return True if campaign has funds, false otherwise
     */
    function hasFunds() external view onlyInitialized returns (bool) {
        return campaignData.encryptedRaised.length > 0;
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
