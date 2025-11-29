// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.12;

/// @title MultiSig Wallet Interface
/// @author Jack Zheng
abstract contract IMultiSigWallet {

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
    /// @param info Additional data for the transaction
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

    /// @param owners The list of initial owners
    /// @param required The number of confirmations required
    constructor(address[] memory owners, uint256 required) public {
        // Implementation goes in derived contract
    }

    /// @param recipient The destination address of the transaction
    /// @param amount The ETH amount to send
    /// @param info Additional data for the transaction
    function submitTransaction(
        address recipient,
        uint256 amount,
        bytes memory info
    ) external virtual;

    /// @param txID The index of the transaction to confirm
    function confirmTransaction(
        uint256 txID
    ) external virtual;

    /// @param txIndex The index of the transaction to revoke confirmation for
    function revokeConfirmation(
        uint256 txIndex
    ) external virtual;

    /// @param txID The index of the transaction to execute
    function executeTransaction(
        uint256 txID
    ) external virtual;

    /// @param txID The index of the transaction
    /// @return count The number of confirmations
    function getConfirmationCount(
        uint256 txID
    ) external view virtual returns (uint256 count);
}
