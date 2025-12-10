const MultiSigWallet = artifacts.require("MultiSigWallet");

contract("MultiSigWallet", async accounts => {
  let wallet;

  const owners = [
    "0xF82E4D100B80EB5F031f7f079F6401E996565863",//addy 1 inddex 0
    "0x489d2c02179f03802c357c766f62d455442Cf007",//addy 2 index 1 
    "0xB8FDc2Be5690F386C102B06060DA6936444aAb91",//addy 3 index 2 
    "0x4B54f47aBE69853e75f9bFaC797442b55136A416",//addy 4 index 3 
    "0x1DFe37D28315688Ba87141B2D970950348B4562a"//addy 5 index 4
  ];
  const threshold = 4;
  const recipient = "0x4c7aF7Db6faB11298C9F0714ae7bF1e755446eD2";



//Submit transaction
  const submitTransaction = async (amount, txIndex) => {
    await wallet.submitTransaction(recipient,web3.utils.toWei(amount.toString(), "ether"),"0x",
  { from: owners[0] }//submitter
  );
    console.log(`Transaction #${txIndex} submitted: ${amount} ETH`);
  };

//confirm transaction by rotating owners
const confirmTransactionRotated = async (txIndex, numConfirmations) => {
  const tx = await wallet.transactions(txIndex);
  const alreadyConfirmed = [];

  for (const owner of owners) {
    const isConfirmed = await wallet.isConfirmed(txIndex, owner);
    if (isConfirmed) alreadyConfirmed.push(owner); //Check which owners have already confirmed
  }

  let confirmedCount = 0;
  let i = 0;
  while (confirmedCount < numConfirmations) {
    const owner = owners[i % owners.length];
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

  const updatedTx = await wallet.transactions(txIndex);
  console.log(`Transaction #${txIndex} confirmations now: ${updatedTx.numConfirmations}`);
};


//execute transaction
  const executeTransaction = async (txIndex) => {
    try {
      const walletBalanceBefore = await web3.eth.getBalance(wallet.address);
      const recipientBalanceBefore = await web3.eth.getBalance(recipient);

      await wallet.executeTransaction(txIndex, { from: owners[0] });

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
    }
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

  // Transaction 1: 1 ETH, fully confirmed by 4 owners
  it("Transaction 1: submit, confirm with 4 owners, then execute", async () => {
    await submitTransaction(1, 0);
    await confirmTransactionRotated(0, 4);//4 confirmations
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


