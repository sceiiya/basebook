// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BaseBookEscrow
 * @dev Escrow contract for BaseBook remittance platform
 * @author MetaBase Team
 */
contract BaseBookEscrow is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // Escrow transaction structure
    struct EscrowTransaction {
        address sender;
        address recipient;
        uint256 amount;
        uint256 timestamp;
        bool isWithdrawn;
        bool exists;
    }

    // State variables
    IERC20 public immutable usdcToken;
    uint256 private _transactionCounter;
    mapping(uint256 => EscrowTransaction) public escrowTransactions;
    mapping(address => uint256[]) public senderTransactions;
    mapping(address => uint256[]) public recipientTransactions;

    // Events
    event FundsDeposited(
        uint256 indexed transactionId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );

    event FundsWithdrawn(
        uint256 indexed transactionId,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );

    event EmergencyWithdrawal(
        uint256 indexed transactionId,
        address indexed sender,
        uint256 amount,
        uint256 timestamp
    );

    // Custom errors
    error InvalidAmount();
    error TransactionNotFound();
    error AlreadyWithdrawn();
    error UnauthorizedWithdrawal();
    error InsufficientAllowance();
    error TransferFailed();

    constructor(address _usdcToken) Ownable(msg.sender) {
        require(_usdcToken != address(0), "BaseBookEscrow: Invalid USDC token address");
        usdcToken = IERC20(_usdcToken);
        _transactionCounter = 0;
    }

    /**
     * @dev Send funds to escrow for a specific recipient
     * @param recipient Address of the recipient
     * @param amount Amount of USDC to send
     * @return transactionId The ID of the created escrow transaction
     */
    function sendFunds(address recipient, uint256 amount) 
        external 
        nonReentrant 
        returns (uint256 transactionId) 
    {
        if (amount == 0) revert InvalidAmount();
        require(recipient != address(0), "BaseBookEscrow: Invalid recipient address");
        require(recipient != msg.sender, "BaseBookEscrow: Cannot send to yourself");

        // Check allowance
        uint256 allowance = usdcToken.allowance(msg.sender, address(this));
        if (allowance < amount) revert InsufficientAllowance();

        // Transfer tokens to escrow
        try usdcToken.safeTransferFrom(msg.sender, address(this), amount) {
            // Create escrow transaction
            transactionId = ++_transactionCounter;
            
            escrowTransactions[transactionId] = EscrowTransaction({
                sender: msg.sender,
                recipient: recipient,
                amount: amount,
                timestamp: block.timestamp,
                isWithdrawn: false,
                exists: true
            });

            // Update transaction mappings
            senderTransactions[msg.sender].push(transactionId);
            recipientTransactions[recipient].push(transactionId);

            emit FundsDeposited(transactionId, msg.sender, recipient, amount, block.timestamp);
        } catch {
            revert TransferFailed();
        }
    }

    /**
     * @dev Withdraw funds from escrow (only recipient can call)
     * @param transactionId ID of the escrow transaction
     */
    function withdrawFunds(uint256 transactionId) external nonReentrant {
        EscrowTransaction storage transaction = escrowTransactions[transactionId];
        
        if (!transaction.exists) revert TransactionNotFound();
        if (transaction.isWithdrawn) revert AlreadyWithdrawn();
        if (transaction.recipient != msg.sender) revert UnauthorizedWithdrawal();

        // Mark as withdrawn
        transaction.isWithdrawn = true;

        // Transfer funds to recipient
        try usdcToken.safeTransfer(transaction.recipient, transaction.amount) {
            emit FundsWithdrawn(transactionId, transaction.recipient, transaction.amount, block.timestamp);
        } catch {
            // Revert the withdrawal status if transfer fails
            transaction.isWithdrawn = false;
            revert TransferFailed();
        }
    }

    /**
     * @dev Emergency withdrawal by sender (only if not withdrawn after 30 days)
     * @param transactionId ID of the escrow transaction
     */
    function emergencyWithdrawal(uint256 transactionId) external nonReentrant {
        EscrowTransaction storage transaction = escrowTransactions[transactionId];
        
        if (!transaction.exists) revert TransactionNotFound();
        if (transaction.isWithdrawn) revert AlreadyWithdrawn();
        require(transaction.sender == msg.sender, "BaseBookEscrow: Only sender can emergency withdraw");
        require(
            block.timestamp >= transaction.timestamp + 30 days,
            "BaseBookEscrow: Emergency withdrawal only after 30 days"
        );

        // Mark as withdrawn
        transaction.isWithdrawn = true;

        // Transfer funds back to sender
        try usdcToken.safeTransfer(transaction.sender, transaction.amount) {
            emit EmergencyWithdrawal(transactionId, transaction.sender, transaction.amount, block.timestamp);
        } catch {
            // Revert the withdrawal status if transfer fails
            transaction.isWithdrawn = false;
            revert TransferFailed();
        }
    }

    /**
     * @dev Get transaction details
     * @param transactionId ID of the transaction
     * @return Transaction details
     */
    function getTransaction(uint256 transactionId) 
        external 
        view 
        returns (EscrowTransaction memory) 
    {
        if (!escrowTransactions[transactionId].exists) revert TransactionNotFound();
        return escrowTransactions[transactionId];
    }

    /**
     * @dev Get all transaction IDs for a sender
     * @param sender Address of the sender
     * @return Array of transaction IDs
     */
    function getSenderTransactions(address sender) external view returns (uint256[] memory) {
        return senderTransactions[sender];
    }

    /**
     * @dev Get all transaction IDs for a recipient
     * @param recipient Address of the recipient
     * @return Array of transaction IDs
     */
    function getRecipientTransactions(address recipient) external view returns (uint256[] memory) {
        return recipientTransactions[recipient];
    }

    /**
     * @dev Get current transaction counter
     * @return Current transaction counter
     */
    function getTransactionCounter() external view returns (uint256) {
        return _transactionCounter;
    }

    /**
     * @dev Check if transaction exists and is withdrawable by recipient
     * @param transactionId ID of the transaction
     * @param recipient Address of the potential recipient
     * @return True if withdrawable, false otherwise
     */
    function isWithdrawable(uint256 transactionId, address recipient) 
        external 
        view 
        returns (bool) 
    {
        EscrowTransaction memory transaction = escrowTransactions[transactionId];
        return transaction.exists && 
               !transaction.isWithdrawn && 
               transaction.recipient == recipient;
    }

    /**
     * @dev Get contract balance of USDC tokens
     * @return Contract's USDC balance
     */
    function getContractBalance() external view returns (uint256) {
        return usdcToken.balanceOf(address(this));
    }

    /**
     * @dev Owner function to withdraw any stuck tokens (emergency only)
     * @param token Address of the token to withdraw
     * @param amount Amount to withdraw
     */
    function ownerEmergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}
