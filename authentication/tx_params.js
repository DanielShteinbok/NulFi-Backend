// compare tx params against permissions in database
// need ethers to work with big numbers
const ethers = require("ethers");

const db_requests = require("./../database/db_requests")
const errors = require("./../errors/errors")

async function getUserAndWallet(auth_addr) {
    const auth_wallet_pairs = (await db_requests.query(
        "SELECT * from " + process.env.schema + ".auth_wallet_pairs WHERE auth_address='" + auth_addr + 
    "' AND wallet_address='" + wallet_addr + "';")).rows;
    // check that there is exactly one such pair
    if (auth_wallet_pairs.length == 0) {
        throw errors.PermissionError("Unauthorized: Auth address" + auth_addr + " not authorized for wallet address " + wallet_addr);
    } else if (auth_wallet_pairs.length > 1){
        throw errors.DatabaseError("Database Error: multiple pairs exist for this auth address");
    }
    return [auth_wallet_pairs[0].user_id, auth_wallet_pairs.wallet_address]
}

async function getGroups(user_id) {
    const groups = (await db_requests.query("SELECT group_id FROM " + process.env.schema + 
    ".user_groups WHERE user_id='" + user_id + "';")).rows;

    // check if this user is not part of any groups, then throw error
    if (groups.length == 0) {
        throw errors.PermissionError("User is not part of any groups! Cannot have permissions for anything.");
    }
    return groups
}

// have multiple root permissions for each (group, wallet) pair
async function getRootPermissionsForGroup(group_id, wallet_addr) {
    permissions = await db_requests.query("SELECT permission_id FROM " + process.env.schema + ".perm_pair WHERE address='" + wallet_addr
    + "' AND group_id='" + group_id + "';")
    return permissions.rows
}

async function getOnePermission(permission_id) {
    const permissions = (await db_requests.query("SELECT * FROM " + process.env.schema 
    + ".permissions WHERE permission_id='" + permission_id + "';")).rows;
    // TODO: check that permissions has length 1
    if (permissions.length != 1) {
        throw errors.DatabaseError("More than one permission with the same permission_id. This shouldn't ever happen.")
    }
    return permissions[0]
}

function checkData(tx_data, db_data) {
    // character-by-character comparison of the data strings
    // assume both are hexadecimal, and neither is prepended by 0x
    // everything after the end of db_data is considered fair game
    for (let i=0; i<db_data.length; ++i) {
        if (db_data[i] != 'g' && db_data[i] != tx_data[i]) {
            return false
        }
    }
    return true
}

async function checkCondition(cond_id, transaction, throw_on=true) {
    // check the condition against the transaction. Throw NotAnError instance if true.
    // assume that what's returned is an array of bytes, which on toString conversion are hexadecimal
    // i.e. for an 8-byte uint256 we store 8 characters, so actually 64 bytes instead of 8.
    
    // get the condition
    conditions = (await db_requests.query("SELECT * FROM" + process.env.schema + "conditions WHERE cond_id=" + cond_id)).rows;

    // verify that we only have one condition
    if (conditions.length == 0) {
        throw errors.DatabaseError("Referenced condition not found in database")
    } else if (conditions.length > 1) {
        throw errors.DatabaseError("More than one condition for this cond_id")
    }

    check_result = (
        // ensure that the gas price is no more than max_gas_price
        transaction.gasPrice > ethers.getUint("0x" + conditions[0].max_gas_price.toString())

        // ensure that the gas limit is no more than max_gas_limit
        || transaction.gasLimit > ethers.getUint("0x" + conditions[0].max_gas_limit.toString())


        // ensure that the to matches a known address
        || transaction.to != "0x" + conditions[0].send_to.toString()

        // ensure that the value is no more than the max_value
        || transaction.value > ethers.getUint("0x" + conditions[0].max_value.toString())

        // ensure that the data matches the data we want
        || !checkData(transaction.data.substring(2), conditions[0].data.toString())
    );

    if (check_result == throw_on) {
        throw new errors.NotAnError("Condition with cond_id " + cond_id + " returned " + throw_on)
    }
    return !throw_on

    //if (
        //// ensure that the gas price is no more than max_gas_price
        //transaction.gasPrice > ethers.BigNumber.from("0x" + conditions[0].max_gas_price.toString())

        //// ensure that the gas limit is no more than max_gas_limit
        //|| transaction.gasLimit > ethers.BigNumber.from("0x" + conditions[0].max_gas_limit.toString())


        //// ensure that the to matches a known address
        //|| transaction.to != "0x" + conditions[0].send_to.toString()

        //// ensure that the value is no more than the max_value
        //|| transaction.value > ethers.BigNumber.from("0x" + conditions[0].max_value.toString())

        //// ensure that the data matches the data we want
        //|| !checkData(transaction.data.substring(2), conditions[0].data.toString())
    //) 
    //{
        //return false
    //}
    //return true
}


// traverse the tree of chained permissions and check each one
// this is SHIT because we can't actually return a promise
async function checkPermission(permission_id, transaction, resolve) {
    // just a function that should run be run inside a Promise
    // DOES NOT RETURN ANYTHING
    // throw_on=true necessary if the conditions are chained with OR or NAND
    // get the permission in question
    // DO need to get permission, this contains info on OR or AND etc
    const permission = await getOnePermission(permission_id);
    switch (permission[0].requirement) {
        case 'or':
            throw_on = true;
            eval_on_throw = true;
        case 'and':
            throw_on = false;
            eval_on_throw = false;
        case 'nor':
            throw_on = true;
            eval_on_throw = false;
        case 'nand':
            throw_on = false;
            eval_on_throw = true;
    }

    condition_ids = (await db_requests.query("SELECT * FROM " + process.env.schema + ".perm_cond_pairs WHERE permission_id='"
    + permission_id + "';")).rows;

    // retrieve each condition, check it
    var conditions_to_check = []
    // put all the promises together
    for (condition_pair in condition_ids) {
        conditions_to_check.append(checkCondition(condition_pair.cond_id, transaction, throw_on));
    }
    
    // check the condition Promises
    Promise.all(conditions_satisfied).then(() => {resolve(!eval_on_throw)}).catch((error) => {
        if (error instanceof errors.NotAnError) {
            // then, we evaluated to eval_on_throw. Must call this function again with appropriate function
            switch(eval_on_throw){
                case true:
                    next = permissions[0].next_if_true;
                case false:
                    next =  permissions[0].next_if_false;
            }
            // we've gotten to the end of the line. Does this mean we were successful or not?
            // this depends on how the permission was evaluated. I define it as follows:
            // at the end of the line, if permission evaluated to true then the permission is good and we can sign the transaction.
            // if the permission evaluated to false, then the permission is bad and we don't sign the transaction right away,
            // but perhaps a different permission will evaluate to true and result in signing.
            if (next == null) {
                switch(eval_on_throw) {
                    case true:
                        throw errors.NotAnError("Condition met successfully")
                    case false:
                        resolve()
                }
            } else {
                // create a Promise to recursively evaluate permissions
                new Promise((resolve) => {
                    checkPermission(next, transaction, resolve)
                })
            }
        } else {
            throw error
        }
    })
}


async function checkPermissions(auth_addr, transaction, callback_if_true, callback_if_false) {
    const [user_id, wallet_address] = await getUserAndWallet(auth_addr);
    const groups = getGroups(user_id);
    // can throw an error to stop execution once we have a successful path
    // otherwise need a list of promises and then we can use Promise.all() to see that all the promises returned
    permissions_to_check = []
    for (const group_id in groups) {
        getRootPermissionsForGroup(group_id).then((permission_id_list) => {
            for (const permission_id in permission_id_list) {
                permissions_to_check.append(new Promise((resolve) => {checkPermission(permission_id, transaction, resolve)}));
            }
        })

    }
    // if everything is resolved and we haven't yet thrown a single true, they were all dead ends
    // otherwise if something throws a NotAnError we know that a permission was satisfied
    Promise.all(permissions_satisfied).then(callback_if_false).catch((error) => {
        if (error instanceof errors.NotAnError) {
            callback_if_true
        } else {
            throw error
        }
    });
}

module.exports = {checkPermissions, checkCondition}



