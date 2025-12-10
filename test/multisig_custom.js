const MultiSigWallet = artifacts.require("MultiSigWallet");

contract("MultiSigWallet", async accounts => {
  let wallet;//holds deployed wallet

  const owners = [
    "0xf2e790bA51D16E8261A9690A3A4Abc070d0611a3",//addy 1 inddex 0
    "0xDD30Ea3Ce36FD8F7322BfaD5034C40e974ee6207",//addy 2 index 1 
    "0xf8d40eE4DA9eA4c0C68b2835Be3ab195f695953C",//addy 3 index 2 
    "0x86C07A39E0898B6292eb1D2be5091Cf4E939001d",//addy 4 index 3 
    "0x933b934bd33b2c1b0E6069cB2BBFcD58930048a7"//addy 5 index 4
  ];
  const threshold = 4;//minimum confirmations
  const recipient = "0xC2cB41D21a285E1942743548d7Ac47Aa5650c562";//addy to transfer ETH


//Submit transaction
  const submitTransaction = async (amount, txIndex) => {
    await wallet.submitTransaction(recipient,web3.utils.toWei(amount.toString(), "ether"),"0x",
  { from: owners[0] }//submitter to recipient can change if needed 
  );
    console.log(`Transaction #${txIndex} submitted: ${amount} ETH`);
  };




//confirm transaction by rotating owners
const confirmTransactionRotated = async (txIndex, numConfirmations) => {
  const tx = await wallet.transactions(txIndex);
  const alreadyConfirmed = [];//array of wallet IDS already confirmed 

  for (const owner of owners) {
    const isConfirmed = await wallet.isConfirmed(txIndex, owner);
    if (isConfirmed) alreadyConfirmed.push(owner); //Check which owners have already confirmed
  }

  let confirmedCount = 0;//start with 0 and then go up with confirmed counts
  let i = 0;
  while (confirmedCount < numConfirmations) {
    const owner = owners[i % owners.length];//loops through owners who have confirmed 
    if (!alreadyConfirmed.includes(owner)) {
      await wallet.confirmTransaction(txIndex, { from: owner });
      console.log(`Transaction #${txIndex} confirmed by ${owner}`);
      confirmedCount++;
    }
    i++;
  }
  const updatedTx = await wallet.transactions(txIndex);
  console.log(`Transaction #${txIndex} confirmations: ${updatedTx.numConfirmations}`);
};



//revoke a confirmation
const revokeConfirmation = async (txIndex, revokerIndex) => {
  const revoker = owners[revokerIndex];
  await wallet.revokeConfirmation(txIndex, { from: revoker });
  console.log(`Transaction #${txIndex} confirmation revoked by ${revoker}`);

  const updatedTx = await wallet.transactions(txIndex);//revokes a transaction 
  console.log(`Transaction #${txIndex} confirmations now: ${updatedTx.numConfirmations}`);
};


//execute transaction
  const executeTransaction = async (txIndex) => {
    try {
      //balances before execution
      const walletBalanceBefore = await web3.eth.getBalance(wallet.address);
      const recipientBalanceBefore = await web3.eth.getBalance(recipient);

      await wallet.executeTransaction(txIndex, { from: owners[0] });
      //balances after execution
      const walletBalanceAfter = await web3.eth.getBalance(wallet.address);
      const recipientBalanceAfter = await web3.eth.getBalance(recipient);

      console.log(`Transaction #${txIndex} executed:`);
      console.log("  Wallet balance:", web3.utils.fromWei(walletBalanceAfter, "ether"), "ETH");
      console.log("  Recipient balance:", web3.utils.fromWei(recipientBalanceAfter, "ether"), "ETH");
      console.log(
        "  ETH transferred:",
        web3.utils.fromWei(
          (BigInt(recipientBalanceAfter) - BigInt(recipientBalanceBefore)).toString(),
          "ether"
        ),
        "ETH"
      );
    } catch (error) {
      console.log(`Transaction #${txIndex} NOT executed yet. Reason: ${error.reason || error.message}`);
    }//log if transaction cannot be executed 
  };

  it("Deploy wallet with 5 owners and 4 confirmations required, and deposit 20 ETH", async () => {
    wallet = await MultiSigWallet.new(owners, threshold);

    await web3.eth.sendTransaction({
      from: owners[0],//from first owner 
      to: wallet.address,
      value: web3.utils.toWei("20", "ether")//depo into smart contract
    });

    const walletBalance = await web3.eth.getBalance(wallet.address);
    console.log("Wallet initial balance:", web3.utils.fromWei(walletBalance, "ether"), "ETH");
  });

  // Transaction 1: 1 ETH, fully confirmed by 5 owners
  it("Transaction 1: submit, confirm with 4 owners, then execute", async () => {
    await submitTransaction(1, 0);
    await confirmTransactionRotated(0, 5);//5 confirmations
    await executeTransaction(0);
  });

  // Transaction 2: 3 ETH, only 2 owners confirm (not enough to execute)
  it("Transaction 2: submit, partial confirmations", async () => {
    await submitTransaction(3, 1);
    await confirmTransactionRotated(1, 2);//2 confirmations confirmations
    await executeTransaction(1);//should fail because threshold not reached
  });

  // Add 2 more confirmations for transaction 2 to reach threshold
  it("Transaction 2: add more confirmations and execute", async () => {
    await confirmTransactionRotated(1, 2);//2 confirmations only
    await executeTransaction(1);//now should succeed
  });

  // Transaction 3: 15 ETH, all 4 confirmations at once
  it("Transaction 3: submit, confirm with 4 owners, then execute", async () => {
    await submitTransaction(15, 2);
    await confirmTransactionRotated(2, 4);//4 confirmations
    await executeTransaction(2);
  });

  it("Transaction 4: submit, confirm 4 owners, revoke 1, then execute", async () => {
  await submitTransaction(1, 3);
  await confirmTransactionRotated(3, 4);
  await revokeConfirmation(3, 1);//owner 1 revokes
  await executeTransaction(3);
});

});


