const db_requests = require("./../database/db_requests")
const tx_params = require("./tx_params")
const auth_addr = require("./auth_addr")
const errors = require('./../errors/errors')
const ethers = require("ethers");

require('dotenv').config();

// mock db_requests to return the results that I want
// perhaps don't mock it yet
//jest.mock('./../database/db_requests')

test("should allow a transaction that's allowed (checkCondition only)", async () => {
    condition_list = [{
        max_gas_price: "FFFFFFFFFFFFFFFF",
        max_gas_limit: "FFFFFFFFFFFFFFFF",
        send_to: '0c54fccd2e384b4bb6f2e405bf5cbc15a017aafb',
        max_vale: '0',
        data: ''
    }];
    //db_requests.query.mockResolvedValue(new Promise((resolve) => {
        //resolve({rows: condition_list})
    //}));
    const tx_serialized = 'f868158502540be400825208940c54fccd2e384b4bb6f2e405bf5cbc15a017aafb80808401546d71a0cc02cda3b70183735fe69a5dafdbd91de69614c7eeb452d4edfa5ca8d11f7965a035e1960c849287421ead7a0ed482fb115bde95fb2492115f42a20e784fb1a12f';
    const tx = ethers.Transaction.from("0x" + tx_serialized);
    //await expect(async () => {await tx_params.checkCondition('some condition id', tx)}).rejects.toThrow();
    await expect(async () => {await tx_params.checkCondition('5', tx)}).rejects.toThrow();
});

// TODO: check a complete set of permissions
// lots of mocking, lots of code, so will leave for a different day (as of Nov 20)

test("Should allow a legal transaction to pass, but only once despite many legal paths", async done => {
    // this is easy enough to test
    const tx_serialized = 'f868158502540be400825208940c54fccd2e384b4bb6f2e405bf5cbc15a017aafb80808401546d71a0cc02cda3b70183735fe69a5dafdbd91de69614c7eeb452d4edfa5ca8d11f7965a035e1960c849287421ead7a0ed482fb115bde95fb2492115f42a20e784fb1a12f';
    const tx = ethers.Transaction.from("0x" + tx_serialized);
    tx_params.checkPermissions(await auth_addr.getAddress(tx_serialized),
        tx, () => {console.log("Finished successfully"); done()}, () => {throw Error}
    )
}, 30000);

test("Should allow a transaction even when only one of many paths is legal", async () => {
    // example is we want to disallow execute() commands unless they are targeting the Universal Router contract.
    // alternatively, could look at an existing airdrop's transactions, and allow/disallow those as something more close to reality.
})