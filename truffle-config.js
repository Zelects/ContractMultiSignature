module.exports = {
  networks: {
  development: {
    host: "127.0.0.1",//host for ganache
    port: 7545,//port 7545 instead of 8545 
    network_id: "*",
    gas: 6721975//avg gas limit for ganache
  }
  },

  compilers: {
    solc: {
      version: "0.6.12",//version
  
    }
  },
};