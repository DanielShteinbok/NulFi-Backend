const db_requests = require("./../database/db_requests")
const tx_params = require("./tx_params")
const auth_addr = require("./auth_addr")
const errors = require('./../errors/errors')
const ethers = require("ethers");

require('dotenv').config();

// mock db_requests to return the results that I want
// perhaps don't mock it yet
jest.mock('./../database/db_requests')

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

//test("Should allow a legal transaction to pass, but only once despite many legal paths", async (done) => {
test("Should allow a legal transaction to pass, but only once despite many legal paths", async () => {
    // this is easy enough to test
    const tx_serialized = 'f868158502540be400825208940c54fccd2e384b4bb6f2e405bf5cbc15a017aafb80808401546d71a0cc02cda3b70183735fe69a5dafdbd91de69614c7eeb452d4edfa5ca8d11f7965a035e1960c849287421ead7a0ed482fb115bde95fb2492115f42a20e784fb1a12f';
    const tx = ethers.Transaction.from("0x" + tx_serialized);

    // mock db appropriately
    //jest.mock('./../database/db_requests', () => {
        //query: jest.fn().mockImplementation(async (request) => {
    db_requests.query.mockImplementation(async (request) => {
        var toReturn;
        switch (request) {
            case "SELECT * FROM org_data.conditions WHERE cond_id=5":
                toReturn = {
                    rows: [
                        {
                            cond_id: 5,
                            max_gas_price: Buffer.from('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'hex'),
                            max_gas_limit: Buffer.from('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'hex'),
                            send_to: Buffer.from([0x30, 0x78, 0x30, 0x63, 0x35, 0x34, 0x66, 0x63, 0x63, 0x64, 0x32, 0x65, 0x33, 0x38, 0x34, 0x62, 0x34, 0x62, 0x62, 0x36, 0x66, 0x32, 0x65, 0x34, 0x30, 0x35, 0x62, 0x66, 0x35, 0x63, 0x62, 0x63, 0x31, 0x35, 0x61, 0x30, 0x31, 0x37, 0x61, 0x61, 0x66, 0x62]),
                            max_value: null,
                            data: null
                        }
                    ]
                };
                break;
            case "SELECT * from org_data.auth_wallet_pairs WHERE auth_address='0x6E3E27B40Ccaf1458fF76eCE21049Ea191F766cE';":
                toReturn = {
                    rows: [
                        {
                        auth_address: Buffer.from('0x6E3E27B40Ccaf1458fF76eCE21049Ea191F766cE'),
                        wallet_address: Buffer.from('0x6E3E27B40Ccaf1458fF76eCE21049Ea191F766cE'),
                        user_id: 1
                        }
                    ]
                };
                break;
            case "SELECT group_id FROM org_data.user_groups WHERE user_id='1';":
                toReturn = {
                    rows: [ { group_id: 1 } ]
                };
                break;

            case "SELECT permission_id FROM org_data.perm_pair WHERE address='0x6E3E27B40Ccaf1458fF76eCE21049Ea191F766cE' AND group_id='1';":
                toReturn = {
                    rows: [ { permission_id: 2 } ]
                };
                break;

            case "SELECT * FROM org_data.permissions WHERE permission_id='2';":
                toReturn = {
                    rows: [
                        {
                        permission_id: 2,
                        requirement: 'or',
                        description: 'Transaction has eth?',
                        next_if_true: 1,
                        next_if_false: 3
                        }
                    ]
                };
                break;

            case "SELECT * FROM org_data.perm_cond_pairs WHERE permission_id='2';":
                toReturn = {
                    rows: [ { permission_id: 2, cond_id: 1 } ]
                };
                break;

            case "SELECT * FROM org_data.conditions WHERE cond_id=1":
                toReturn = {
                    rows: [
                        {
                        cond_id: 1,
                        max_gas_price: Buffer.from('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'hex'),
                        max_gas_limit: Buffer.from('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'hex'),
                        send_to: null,
                        max_value: Buffer.from([0, 0, 0, 0]),
                        data: null
                        }
                    ]
                };
                break;
            
            case "SELECT * FROM org_data.permissions WHERE permission_id='3';":
                toReturn = {
                    rows: [
                        {
                        permission_id: 3,
                        requirement: 'or',
                        description: 'Inverter',
                        next_if_true: null,
                        next_if_false: null
                        }
                    ]
                };
                break;

            case "SELECT * FROM org_data.perm_cond_pairs WHERE permission_id='3';":
                toReturn = {
                    rows: [ { permission_id: 3, cond_id: 4 } ]
                };
                break;

            case "SELECT * FROM org_data.conditions WHERE cond_id=4":
                toReturn = {
                    rows: [
                        {
                        cond_id: 4,
                        send_to: null,
                        max_gas_price: Buffer.from('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'hex'),
                        max_gas_limit: Buffer.from('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'hex'),
                        max_value: null,
                        data: null
                        }
                    ]
                };
        }
        return toReturn
    //})
    });
    
    try {
    const permission_checker = await tx_params.checkPermissions(await auth_addr.getAddress(tx_serialized), tx);
    console.log(permission_checker);
    } catch (error) {
        console.log(error)
    }
    console.log("Got here");
}, 30000);
    //db_requests.query.mockImplementation(async (request) => {
        

test("Should allow a transaction even when only one of many paths is legal", async () => {
    // example is we want to disallow execute() commands unless they are targeting the Universal Router contract.
    // alternatively, could look at an existing airdrop's transactions, and allow/disallow those as something more close to reality.
})