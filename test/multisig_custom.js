const MultiSigWallet = artifacts.require("MultiSigWallet");

contract("MultiSigWallet", async accounts => {
  let wallet;

  const owners = [
    "0x77300d0953a03898050DC31609d76C1d0de3230B",//addy 1 inddex 0
    "0x6e6360930973b6458Dd940f062AC0d37bEF190D3",//addy 2 index 1 
    "0x44961D6eDDf0C786a66950abE3e92E52B126A6Fa",//addy 3 index 2 
    "0x052a5D9275d71971F5CcCa3CFa10206951C88A0C",//addy 4 index 3 
    "0xa276e5C9b9c08EACccD0cb52b990ea2cf233D343"//addy 5 index 4
  ];
  const threshold = 4;
  const recipient = "0x12aBDb913271d521e5442F20390C28Cec3fcEa90";

  const submitTransaction = async (amount, txIndex) => {
    await wallet.submitTransaction(recipient,web3.utils.toWei(amount.toString(), "ether"),"0x",
  { from: owners[0] }//submitter
  );
    console.log(`Transaction #${txIndex} submitted: ${amount} ETH`);
  };

  // Helper: confirm transaction by rotating owners safely
const confirmTransactionRotated = async (txIndex, numConfirmations) => {
  const tx = await wallet.transactions(txIndex);
  const alreadyConfirmed = [];

  // Check which owners have already confirmed
  for (const owner of owners) {
    const isConfirmed = await wallet.isConfirmed(txIndex, owner);
    if (isConfirmed) alreadyConfirmed.push(owner);
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



  // Helper: execute transaction
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
      from: owners[0],
      to: wallet.address,
      value: web3.utils.toWei("20", "ether")
    });

    const walletBalance = await web3.eth.getBalance(wallet.address);
    console.log("Wallet initial balance:", web3.utils.fromWei(walletBalance, "ether"), "ETH");
  });

  // Transaction 1: 15 ETH, fully confirmed by 4 owners
  it("Transaction 1: submit, confirm with 4 owners, then execute", async () => {
    await submitTransaction(15, 0);
    await confirmTransactionRotated(0, 4);//4 confirmations
    await executeTransaction(0);
  });

  // Transaction 2: 3 ETH, only 2 owners confirm (not enough to execute)
  it("Transaction 2: submit, partial confirmations", async () => {
    await submitTransaction(3, 1);
    await confirmTransactionRotated(1, 2);//2 confirmations confirmations
    await executeTransaction(1); // should fail because threshold not reached
  });

  // Add 2 more confirmations for transaction 2 to reach threshold
  it("Transaction 2: add more confirmations and execute", async () => {
    await confirmTransactionRotated(1, 2); //  2 confirmations only
    await executeTransaction(1); // now should succeed
  });

  // Transaction 3: 2 ETH, all 4 confirmations at once
  it("Transaction 3: submit, confirm with 4 owners, then execute", async () => {
    await submitTransaction(2, 2);
    await confirmTransactionRotated(2, 4);//4 confirmations
    await executeTransaction(2);
  });
});


