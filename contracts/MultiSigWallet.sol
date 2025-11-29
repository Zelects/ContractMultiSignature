// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

contract MultiSigWallet {
    event Deposit(address indexed sender, uint256 amount);
    event SubmitTransaction(address indexed owner, uint indexed txID, address indexed recipient, uint256 amount, bytes info);
    event ConfirmTransaction(address indexed owner, uint indexed txID);
    event ExecuteTransaction(address indexed owner, uint indexed txID);
    event RevokeConfirmation(address indexed owner, uint indexed txID);

    address[] public owners;
    mapping(address => bool) public isOwner;
    uint public numConfirmationsRequired;

    struct Transaction {//structure of the trans
        address recipient;
        uint256 amount;
        bytes info;
        bool executed;
        uint numConfirmations;
    }

    mapping(uint => mapping(address => bool)) public isConfirmed;
    Transaction[] public transactions;

    modifier onlyOwner() {//makes sure owners can modify
        require(isOwner[msg.sender], "not owner");//check if its owner
        _;
    }

    modifier txExists(uint _txID) {//makes sure transaction exist
        require(_txID < transactions.length, "tx does not exist");//check if true
        _;
    }

    modifier notExecuted(uint _txID) {//makes sure the transaction has not been executed
        require(!transactions[_txID].executed, "tx already executed");
        _;
    }

    modifier notConfirmed(uint _txID) {//makes sure transaction has not been confirmed
        require(!isConfirmed[_txID][msg.sender], "tx already confirmed");
        _;
    }

    constructor(address[] memory _owners, uint _numConfirmationsRequired) public {
        require(_owners.length > 0, "owners required");//makes sure theres at least one owner
        require(_numConfirmationsRequired > 0 && _numConfirmationsRequired <= _owners.length, "invalid number of confirmations");

        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "invalid owner");
            require(!isOwner[owner], "owner not unique");//checks if there is owner and if its unique

            isOwner[owner] = true;
            owners.push(owner);
        }

        numConfirmationsRequired = _numConfirmationsRequired;
    }

    function submitTransaction(address _recipient, uint256 _amount, bytes memory _info) public onlyOwner {
        uint txID = transactions.length;//new transaction to submit

        transactions.push(Transaction({//add transa into array
            recipient: _recipient,
            amount: _amount,
            info: _info,
            executed: false,
            numConfirmations: 0
        }));

        emit SubmitTransaction(msg.sender, txID, _recipient, _amount, _info);
    }
    
    function confirmTransaction(uint _txID)//confirm pending transaction
        public
        onlyOwner
        txExists(_txID)
        notExecuted(_txID)
        notConfirmed(_txID)
    {
        Transaction storage transaction = transactions[_txID];
        transaction.numConfirmations += 1;//mark owner as confirming the transaction
        isConfirmed[_txID][msg.sender] = true;

        emit ConfirmTransaction(msg.sender, _txID);
    }

    function executeTransaction(uint _txID)
        public
        onlyOwner
        txExists(_txID)
        notExecuted(_txID)
    {
        Transaction storage transaction = transactions[_txID];
        require(transaction.numConfirmations >= numConfirmationsRequired, "cannot execute tx");

        transaction.executed = true;//mark executed before exrternal call

        (bool success, ) = transaction.recipient.call{value: transaction.amount}("");
        require(success, "tx failed");

        emit ExecuteTransaction(msg.sender, _txID);
    }

    function revokeConfirmation(uint _txID)//can remove confirmation before execution
        public
        onlyOwner
        txExists(_txID)
        notExecuted(_txID)
    {
        require(isConfirmed[_txID][msg.sender], "tx not confirmed");

        Transaction storage transaction = transactions[_txID];
        transaction.numConfirmations -= 1;//reverse confirmation if its false
        isConfirmed[_txID][msg.sender] = false;

        emit RevokeConfirmation(msg.sender, _txID);
    }

    function getConfirmationCount(uint _txID) public view returns (uint256 count) {
        require(_txID < transactions.length, "tx does not exist");
        return transactions[_txID].numConfirmations;//view # of confirmations
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);//allows contract to recieve eth directly
    }
}
