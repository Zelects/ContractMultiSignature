const MultiSigWallet = artifacts.require("MultiSigWallet");

module.exports = function (deployer, network, accounts) {
  const owners = [accounts[0], accounts[1], accounts[2]];//owners
  const numConfirmationsRequired = 2;//confirmations

  deployer.deploy(MultiSigWallet, owners, numConfirmationsRequired);
};
