// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/SimpleCampaign.sol";

contract SimpleCampaignTest is Test {
    SimpleCampaign public campaign;

    address public creator = address(0x1);
    address public donor1 = address(0x2);
    address public donor2 = address(0x3);

    string public constant TITLE = "Test Campaign";
    string public constant DESCRIPTION = "A test campaign for unit testing";
    uint256 public deadline;

    bytes32 public constant TX_HASH_1 = keccak256("tx1");
    bytes32 public constant TX_HASH_2 = keccak256("tx2");
    bytes32 public constant WITHDRAWAL_HASH_1 = keccak256("withdrawal1");

    function setUp() public {
        deadline = block.timestamp + 30 days;

        vm.prank(creator);
        campaign = new SimpleCampaign(creator, TITLE, DESCRIPTION, deadline);
    }

    // ============ Constructor Tests ============

    function testConstructorSuccess() public {
        assertEq(campaign.creator(), creator);
        assertEq(campaign.title(), TITLE);
        assertEq(campaign.description(), DESCRIPTION);
        assertEq(campaign.deadline(), deadline);
        assertTrue(campaign.isActive());
    }

    function testConstructorInvalidCreator() public {
        vm.expectRevert(SimpleCampaign.InvalidCreator.selector);
        new SimpleCampaign(address(0), TITLE, DESCRIPTION, deadline);
    }

    function testConstructorEmptyTitle() public {
        vm.expectRevert(SimpleCampaign.EmptyTitle.selector);
        new SimpleCampaign(creator, "", DESCRIPTION, deadline);
    }

    function testConstructorInvalidDeadline() public {
        vm.expectRevert(SimpleCampaign.InvalidDeadline.selector);
        new SimpleCampaign(creator, TITLE, DESCRIPTION, block.timestamp - 1);
    }

    // ============ Donation Registration Tests ============

    function testRegisterDonationSuccess() public {
        vm.prank(donor1);
        campaign.registerDonation(TX_HASH_1);

        SimpleCampaign.DonationInfo memory donationInfo = campaign
            .getDonationInfo(TX_HASH_1);
        assertEq(donationInfo.donor, donor1);
        assertEq(donationInfo.timestamp, block.timestamp);
        assertTrue(donationInfo.exists);

        bytes32[] memory hashes = campaign.getDonationHashes();
        assertEq(hashes.length, 1);
        assertEq(hashes[0], TX_HASH_1);
        assertEq(campaign.getDonationCount(), 1);
    }

    function testRegisterMultipleDonations() public {
        vm.prank(donor1);
        campaign.registerDonation(TX_HASH_1);

        vm.prank(donor2);
        campaign.registerDonation(TX_HASH_2);

        assertEq(campaign.getDonationCount(), 2);

        bytes32[] memory hashes = campaign.getDonationHashes();
        assertEq(hashes.length, 2);
        assertEq(hashes[0], TX_HASH_1);
        assertEq(hashes[1], TX_HASH_2);
    }

    function testRegisterDonationAlreadyRegistered() public {
        vm.prank(donor1);
        campaign.registerDonation(TX_HASH_1);

        vm.prank(donor2);
        vm.expectRevert(SimpleCampaign.DonationAlreadyRegistered.selector);
        campaign.registerDonation(TX_HASH_1);
    }

    function testRegisterDonationCampaignInactive() public {
        // Deactivate campaign
        vm.prank(creator);
        campaign.updateStatus();

        vm.prank(donor1);
        vm.expectRevert(SimpleCampaign.CampaignInactive.selector);
        campaign.registerDonation(TX_HASH_1);
    }

    function testRegisterDonationAfterDeadline() public {
        // Move time past deadline
        vm.warp(deadline + 1);

        vm.prank(donor1);
        vm.expectRevert(SimpleCampaign.CampaignInactive.selector);
        campaign.registerDonation(TX_HASH_1);
    }

    // ============ Withdrawal Registration Tests ============

    function testRegisterWithdrawalSuccess() public {
        vm.prank(creator);
        campaign.registerWithdrawal(WITHDRAWAL_HASH_1);

        SimpleCampaign.WithdrawalInfo memory withdrawalInfo = campaign
            .getWithdrawalInfo(WITHDRAWAL_HASH_1);
        assertEq(withdrawalInfo.timestamp, block.timestamp);
        assertTrue(withdrawalInfo.exists);

        bytes32[] memory hashes = campaign.getWithdrawalHashes();
        assertEq(hashes.length, 1);
        assertEq(hashes[0], WITHDRAWAL_HASH_1);
        assertEq(campaign.getWithdrawalCount(), 1);
    }

    function testRegisterWithdrawalUnauthorized() public {
        vm.prank(donor1);
        vm.expectRevert(SimpleCampaign.Unauthorized.selector);
        campaign.registerWithdrawal(WITHDRAWAL_HASH_1);
    }

    function testRegisterWithdrawalAlreadyRegistered() public {
        vm.prank(creator);
        campaign.registerWithdrawal(WITHDRAWAL_HASH_1);

        vm.prank(creator);
        vm.expectRevert(SimpleCampaign.WithdrawalAlreadyRegistered.selector);
        campaign.registerWithdrawal(WITHDRAWAL_HASH_1);
    }

    // ============ View Function Tests ============

    function testGetCampaignInfo() public {
        // Add some donations and withdrawals
        vm.prank(donor1);
        campaign.registerDonation(TX_HASH_1);

        vm.prank(creator);
        campaign.registerWithdrawal(WITHDRAWAL_HASH_1);

        SimpleCampaign.CampaignInfo memory info = campaign.getCampaignInfo();
        assertEq(info.creator, creator);
        assertEq(info.title, TITLE);
        assertEq(info.description, DESCRIPTION);
        assertEq(info.deadline, deadline);
        assertTrue(info.isActive);
        assertEq(info.donationCount, 1);
        assertEq(info.withdrawalCount, 1);
    }

    function testIsDeadlinePassed() public {
        assertFalse(campaign.isDeadlinePassed());

        vm.warp(deadline + 1);
        assertTrue(campaign.isDeadlinePassed());
    }

    // ============ Status Update Tests ============

    function testUpdateStatusByCreator() public {
        assertTrue(campaign.isActive());

        vm.prank(creator);
        campaign.updateStatus();

        assertFalse(campaign.isActive());
    }

    function testUpdateStatusAfterDeadline() public {
        assertTrue(campaign.isActive());

        vm.warp(deadline + 1);

        // Anyone can update status after deadline
        vm.prank(donor1);
        campaign.updateStatus();

        assertFalse(campaign.isActive());
    }

    function testUpdateStatusNoChange() public {
        // Non-creator before deadline should not change status
        vm.prank(donor1);
        campaign.updateStatus();

        assertTrue(campaign.isActive());
    }

    // ============ Event Tests ============

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

    function testCampaignCreatedEvent() public {
        vm.expectEmit(true, false, false, true);
        emit CampaignCreated(creator, TITLE, deadline);

        new SimpleCampaign(creator, TITLE, DESCRIPTION, deadline);
    }

    function testDonationRegisteredEvent() public {
        vm.expectEmit(true, true, false, true);
        emit DonationRegistered(TX_HASH_1, donor1, block.timestamp);

        vm.prank(donor1);
        campaign.registerDonation(TX_HASH_1);
    }

    function testWithdrawalRegisteredEvent() public {
        vm.expectEmit(true, false, false, true);
        emit WithdrawalRegistered(WITHDRAWAL_HASH_1, block.timestamp);

        vm.prank(creator);
        campaign.registerWithdrawal(WITHDRAWAL_HASH_1);
    }

    function testCampaignStatusUpdatedEvent() public {
        vm.expectEmit(false, false, false, true);
        emit CampaignStatusUpdated(false);

        vm.prank(creator);
        campaign.updateStatus();
    }
}
