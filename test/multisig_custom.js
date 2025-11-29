const MultiSigWallet = artifacts.require("MultiSigWallet");

contract("MultiSigWallet Custom Demo", async accounts => {
  let wallet;
  const owners = [
    "0x9B4F95058223Dfa207198083C3312036c0409ded",//index 0
    "0x511653cC78F66a235C7bD5A64BC7f1e6b7D7850D",//index 1
    "0x94335126EcfC6914f77e9982beDbF7d0F6edFf0B",//index 2
    "0x73CE374fEa7E6b5C1a1B69e502315f4C4082379f",//index 3
    "0xeEa0651d444d56BEda888d8Eb2F487388a808C9B"//index 4
  ];
  const threshold = 4;//Need at least 4 confirmations

 //vvv receiver addy
  const recipient = "0x5Cfb1aCA4cec336ba5e62c5d9F77818C1dd090AC";//index 6

  it("Deploy wallet with 5 owners and 4 confirmations required, and deposit 5 ETH", async () => {
    wallet = await MultiSigWallet.new(owners, threshold);

    await web3.eth.sendTransaction({
      from: owners[0],
      to: wallet.address,
      value: web3.utils.toWei("5", "ether")
    });

    const walletBalance = await web3.eth.getBalance(wallet.address);
    console.log("Wallet initial balance:", web3.utils.fromWei(walletBalance, "ether"), "ETH");
  });

  it("Submit a transaction of 4 ETH from the wallet by the 5th owner", async () => {
    const submitter = owners[4];

    await wallet.submitTransaction(
      recipient,
      web3.utils.toWei("4", "ether"),
      "0x", //empty
      { from: submitter }
    );

    const tx = await wallet.transactions(0);
    console.log("Transaction submission from:", submitter);
    console.log("Transaction recipient:", tx.recipient);
    console.log("Transaction amount:", web3.utils.fromWei(tx.amount, "ether"), "ETH");
    console.log("Transaction info:", tx.info);
  });

  it("Confirm the transaction with 4 owners", async () => {//Confirm with first 4 owners
    await wallet.confirmTransaction(0, { from: owners[0] });
    await wallet.confirmTransaction(0, { from: owners[1] });
    await wallet.confirmTransaction(0, { from: owners[2] });
    await wallet.confirmTransaction(0, { from: owners[3] });

    const tx = await wallet.transactions(0);
    console.log("Number of confirmations:", tx.numConfirmations.toString());
  });
  

  it("Execute the transaction from wallet", async () => {
    const walletBalanceBefore = await web3.eth.getBalance(wallet.address);
    const recipientBalanceBefore = await web3.eth.getBalance(recipient);

    console.log("Wallet balance before execution:", web3.utils.fromWei(walletBalanceBefore, "ether"), "ETH");
    console.log("Recipient balance before execution:", web3.utils.fromWei(recipientBalanceBefore, "ether"), "ETH");

    await wallet.executeTransaction(0, { from: owners[0] });

    const walletBalanceAfter = await web3.eth.getBalance(wallet.address);
    const recipientBalanceAfter = await web3.eth.getBalance(recipient);

    console.log("Wallet balance after execution:", web3.utils.fromWei(walletBalanceAfter, "ether"), "ETH");
    console.log("Recipient balance after execution:", web3.utils.fromWei(recipientBalanceAfter, "ether"), "ETH");

    console.log(
      "ETH transferred from wallet to recipient:",
      web3.utils.fromWei(
        (BigInt(recipientBalanceAfter) - BigInt(recipientBalanceBefore)).toString(),
        "ether"
      ),
      "ETH"
    );
  });
});


