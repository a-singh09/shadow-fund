// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IEERC20.sol";
import "../interfaces/IUserRegistrar.sol";
import "../interfaces/IEncryptedBalanceManager.sol";

/**
 * @title EERC20Token
 * @dev Implementation of encrypted ERC20 token with privacy features
 */
contract EERC20Token is IEERC20 {
    string private _name;
    string private _symbol;
    uint8 private _decimals;
    bytes private _encryptedTotalSupply;

    IUserRegistrar public immutable userRegistrar;
    IEncryptedBalanceManager public immutable balanceManager;

    mapping(address => mapping(address => bytes)) private _allowances;
    address public owner;
    address public minter;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyMinter() {
        require(
            msg.sender == minter || msg.sender == owner,
            "Only minter can call this function"
        );
        _;
    }

    modifier onlyRegistered() {
        require(
            userRegistrar.isUserRegistered(msg.sender),
            "User not registered"
        );
        _;
    }

    modifier validProof(bytes memory proof) {
        require(proof.length >= 32, "Invalid proof");
        _;
    }

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        bytes memory encryptedTotalSupply_,
        address userRegistrar_,
        address balanceManager_
    ) {
        require(bytes(name_).length > 0, "Name cannot be empty");
        require(bytes(symbol_).length > 0, "Symbol cannot be empty");
        require(userRegistrar_ != address(0), "Invalid user registrar");
        require(balanceManager_ != address(0), "Invalid balance manager");

        _name = name_;
        _symbol = symbol_;
        _decimals = decimals_;
        _encryptedTotalSupply = encryptedTotalSupply_;
        userRegistrar = IUserRegistrar(userRegistrar_);
        balanceManager = IEncryptedBalanceManager(balanceManager_);
        owner = msg.sender;
        minter = msg.sender;
    }

    /**
     * @dev Set the minter address
     * @param newMinter The new minter address
     */
    function setMinter(address newMinter) external onlyOwner {
        require(newMinter != address(0), "Invalid minter address");
        minter = newMinter;
    }

    /**
     * @dev Returns the name of the token
     */
    function name() external view returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token
     */
    function symbol() external view returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns the decimals of the token
     */
    function decimals() external view returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Returns the encrypted total supply
     */
    function totalSupply() external view returns (bytes memory) {
        return _encryptedTotalSupply;
    }

    /**
     * @dev Returns the encrypted balance of an account
     * @param account The account address
     */
    function balanceOf(address account) external view returns (bytes memory) {
        return balanceManager.getEncryptedBalance(account);
    }

    /**
     * @dev Returns the encrypted allowance
     * @param owner_ The owner address
     * @param spender The spender address
     */
    function allowance(
        address owner_,
        address spender
    ) external view returns (bytes memory) {
        return _allowances[owner_][spender];
    }

    /**
     * @dev Transfer encrypted amount to another address
     * @param to The recipient address
     * @param encryptedAmount The encrypted amount to transfer
     * @param proof Zero-knowledge proof for the transfer
     */
    function transfer(
        address to,
        bytes memory encryptedAmount,
        bytes memory proof
    ) external onlyRegistered validProof(proof) returns (bool) {
        require(to != address(0), "Transfer to zero address");
        require(userRegistrar.isUserRegistered(to), "Recipient not registered");
        require(
            balanceManager.isValidEncryptedAmount(encryptedAmount),
            "Invalid encrypted amount"
        );
        require(
            balanceManager.verifyTransferProof(
                msg.sender,
                to,
                encryptedAmount,
                proof
            ),
            "Invalid transfer proof"
        );

        // Subtract from sender
        balanceManager.subtractFromBalance(msg.sender, encryptedAmount, proof);

        // Add to recipient
        balanceManager.addToBalance(to, encryptedAmount, proof);

        emit Transfer(msg.sender, to, encryptedAmount);
        return true;
    }

    /**
     * @dev Transfer from one address to another using allowance
     * @param from The sender address
     * @param to The recipient address
     * @param encryptedAmount The encrypted amount to transfer
     * @param proof Zero-knowledge proof for the transfer
     */
    function transferFrom(
        address from,
        address to,
        bytes memory encryptedAmount,
        bytes memory proof
    ) external onlyRegistered validProof(proof) returns (bool) {
        require(from != address(0), "Transfer from zero address");
        require(to != address(0), "Transfer to zero address");
        require(userRegistrar.isUserRegistered(from), "Sender not registered");
        require(userRegistrar.isUserRegistered(to), "Recipient not registered");
        require(
            balanceManager.isValidEncryptedAmount(encryptedAmount),
            "Invalid encrypted amount"
        );
        require(
            balanceManager.verifyTransferProof(
                from,
                to,
                encryptedAmount,
                proof
            ),
            "Invalid transfer proof"
        );

        // Check allowance (simplified - in real implementation, this would be homomorphic comparison)
        bytes memory currentAllowance = _allowances[from][msg.sender];
        require(currentAllowance.length > 0, "Insufficient allowance");

        // Subtract from sender
        balanceManager.subtractFromBalance(from, encryptedAmount, proof);

        // Add to recipient
        balanceManager.addToBalance(to, encryptedAmount, proof);

        // Update allowance (simplified)
        _allowances[from][msg.sender] = balanceManager.subtractEncryptedAmounts(
            currentAllowance,
            encryptedAmount
        );

        emit Transfer(from, to, encryptedAmount);
        return true;
    }

    /**
     * @dev Approve spender to spend encrypted amount
     * @param spender The spender address
     * @param encryptedAmount The encrypted amount to approve
     * @param proof Zero-knowledge proof for the approval
     */
    function approve(
        address spender,
        bytes memory encryptedAmount,
        bytes memory proof
    ) external onlyRegistered validProof(proof) returns (bool) {
        require(spender != address(0), "Approve to zero address");
        require(
            userRegistrar.isUserRegistered(spender),
            "Spender not registered"
        );
        require(
            balanceManager.isValidEncryptedAmount(encryptedAmount),
            "Invalid encrypted amount"
        );
        require(
            balanceManager.verifyBalanceProof(
                msg.sender,
                encryptedAmount,
                proof
            ),
            "Invalid approval proof"
        );

        _allowances[msg.sender][spender] = encryptedAmount;

        emit Approval(msg.sender, spender, encryptedAmount);
        return true;
    }

    /**
     * @dev Register user with the eERC20 system
     * @param publicKey The user's public key for encryption
     */
    function registerUser(bytes memory publicKey) external {
        userRegistrar.registerUserFor(msg.sender, publicKey);
        emit UserRegistered(msg.sender, publicKey);
    }

    /**
     * @dev Check if user is registered
     * @param user The user address to check
     */
    function isUserRegistered(address user) external view returns (bool) {
        return userRegistrar.isUserRegistered(user);
    }

    /**
     * @dev Mint encrypted tokens to an address
     * @param to The recipient address
     * @param encryptedAmount The encrypted amount to mint
     * @param proof Zero-knowledge proof for minting
     */
    function mint(
        address to,
        bytes memory encryptedAmount,
        bytes memory proof
    ) external onlyMinter validProof(proof) {
        require(to != address(0), "Mint to zero address");
        require(userRegistrar.isUserRegistered(to), "Recipient not registered");
        require(
            balanceManager.isValidEncryptedAmount(encryptedAmount),
            "Invalid encrypted amount"
        );
        require(
            balanceManager.verifyBalanceProof(to, encryptedAmount, proof),
            "Invalid mint proof"
        );

        balanceManager.addToBalance(to, encryptedAmount, proof);

        emit Transfer(address(0), to, encryptedAmount);
    }
}
