const db_requests = require("./../database/db_requests")
const tx_params = require("./tx_params")
const auth_addr = require("./auth_addr")
const errors = require('./../errors/errors')
const ethers = require("ethers");

require('dotenv').config();
const tx_serialized = 'f868158502540be400825208940c54fccd2e384b4bb6f2e405bf5cbc15a017aafb80808401546d71a0cc02cda3b70183735fe69a5dafdbd91de69614c7eeb452d4edfa5ca8d11f7965a035e1960c849287421ead7a0ed482fb115bde95fb2492115f42a20e784fb1a12f';
const tx = ethers.Transaction.from("0x" + tx_serialized);
(async () => {
const permission_checker = await tx_params.checkPermissions(await auth_addr.getAddress(tx_serialized), tx)
})();