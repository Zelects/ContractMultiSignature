Name : Jack Zheng


Concept
A multi-signature wallet allows a group of addresses to collectively manage ETH or tokens.
Funds can only be withdrawn or transferred if a minimum number of approvals is reached.

some features
Sets of owners
Minimum approvals required (threshold)
Submit transactions (recipient + amount)
Owners approve transactions
Transaction executes only when approvals ≥ threshold


Purpose of the Multi Signature Wallet

This contract provides a secure, decentralized way for a group to manage ETH.

Funds are only transferred when a required number of owners approve a transaction.

Multiple owners must agree on transfers so it is secure and prevents against a single compromised key

it is transparent becuase all proposed and approved transactions are on the chain aka network

Owners can add/remove transactions, approve them, and execute once the threshold is met

All actions (submission, approval, execution) use tracking

middleman operations requiring multiple parties



pragma solidity >=0.4.0 <0.7.0;

/// @author Jack Zheng
/// @title Interface for a Multi-Signature Wallet
interface IMultiSigWallet {
    /// Events
    /// @param sender The address sending ETH
    /// @param amount The amount of ETH deposited
    event Deposit(
        address indexed sender,
        uint256 amount
    );

    /// @param owner The wallet owner submitting the transaction
    /// @param txID The index of the submitted transaction
    /// @param recipient The destination address of the transaction
    /// @param amount The ETH amount to be sent
    /// @param info The info of data
    event SubmitTransaction(
        address indexed owner,
        uint indexed txID,
        address indexed recipient,
        uint256 amount,
        bytes info
    );

    /// @param owner The wallet owner confirming the transaction
    /// @param txID The index of the transaction being confirmed
    event ConfirmTransaction(
        address indexed owner,
        uint indexed txID
    );

    /// @param owner The wallet owner revoking the confirmation
    /// @param txID The index of the transaction being revoked
    event RevokeConfirmation(
        address indexed owner,
        uint indexed txID
    );

    /// @param owner The wallet owner executing the transaction
    /// @param txID The index of the executed transaction
    event ExecuteTransaction(
        address indexed owner,
        uint indexed txID
    );

    // Functions
    /// @param recipient The destination address of the transaction
    /// @param amount The ETH amount to send
    /// @param info the info of data
    function submitTransaction(
        address recipient,
        uint256 amount,
        bytes info
    )
        external;

    /// @param txID The index of the transaction to confirm
    function confirmTransaction(
        uint256 txID
    )
        external;

    /// @param txID The index of the transaction to revoke confirmation for
    function revokeConfirmation(
        uint256 txIndex
    )
        external;

    /// @param txID The index of the transaction to execute
    function executeTransaction(
        uint256 txID
    )
        external;

    /// @param txID The index of the transaction
    /// @return count The number of confirmations
    function getConfirmationCount(
        uint256 txID
    )
        external
        view
        returns (uint256 count);
}
