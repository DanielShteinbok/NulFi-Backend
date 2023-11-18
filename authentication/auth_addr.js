// validate auth address
const ethers = require("ethers");
//const web3 = require('web3');
//const Tx = require('ethereumjs-tx').Transaction;

async function getAddress(signedTransactionSerialized) {
    // we may need to prepend '0x' to the signedTransactionSerialized
    var tx;
    // if it doesn't start with '0x', prepend
    if (signedTransactionSerialized.substring(0, 2) != "0x") {
        tx =  ethers.Transaction.from("0x".concat(signedTransactionSerialized));
    } else {
        tx = ethers.Transaction.from(signedTransactionSerialized);
    }
    return tx.from;
}

module.exports = {getAddress};