const pg = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/mydb';

const client = new pg.Client(connectionString);
(async() => {
await client.connect();
try{
    // create the schema
    await client.query(
        'CREATE SCHEMA org_data;'
    );
    // conditions, should contain all the fields of an ethereum Tx.
    // I just put max values where I thought enforcing exact or min values would not be needed
    // I put the "to" field to be a byte string that must match exactly
    // the data will be a string-stored hex string, but with the character "g" to represent the wildcard
    // all these values must match for the condition to return true
    await client.query(
        "CREATE TABLE org_data.conditions(cond_id SERIAL PRIMARY KEY, \
            max_gas_price bytea DEFAULT '\xFFFFFFFFFFFFFFFF', \
            max_gas_limit bytea DEFAULT '\xFFFFFFFFFFFFFFFF', \
            send_to bytea, max_value bytea, data text);"
    );
    await client.query(
    'CREATE TABLE org_data.wallets(address bytea PRIMARY KEY, private_key bytea)'
    );
    // create enum to represent OR and AND
    await client.query(
        "CREATE TYPE org_data.logical AS ENUM('or', 'and', 'nor', 'nand');"
    );
    // permission. This is separate from the pairs because we may want the same permission for many wallet pairs
    // allows chaining permissions; from A, evaluate all conditions and combine according to requirement.
    // if result is true, proceed to B. If result is false, proceed to C.
    // if next node is NULL, we've reached the end of the line. 
    // At that point, if condition is true, sign transaction. If condition is false, abort transaction.
    await client.query(
        'CREATE TABLE org_data.permissions(permission_id SERIAL PRIMARY KEY, requirement org_data.logical, description text, \
            next_if_true integer REFERENCES org_data.permissions, next_if_false integer REFERENCES org_data.permissions);'
    );
    // junction table: pair of permission and condition. We will have a lot of these, to faciliate a many-to-many relation.
    // PRIMARY KEY ensures we cannot have two different connections between the same pair of permission and condition
    await client.query(
        'CREATE TABLE org_data.perm_cond_pairs(permission_id integer REFERENCES org_data.permissions, \
            cond_id integer REFERENCES org_data.conditions, \
            PRIMARY KEY (permission_id, cond_id));'
    );
    // group. Just stores a group ID. Isn't useful directly (could in principle just share group number)
    // but seems "elegant" because it requires us to add a group to the database before we can add users to it.
    await client.query(
        'CREATE TABLE org_data.groups(group_id SERIAL PRIMARY KEY);'
    );
    // pair of wallet, permission. Must be specific to a group.
    await client.query(
        'CREATE TABLE org_data.perm_pair(address bytea REFERENCES org_data.wallets, \
            permission_id integer REFERENCES org_data.permissions, group_id integer REFERENCES org_data.groups, \
            PRIMARY KEY(address, permission_id, group_id));'
    );
    // user can potentially be part of multiple groups, we will need a junction table for this.
    // this can lead to ambiguity in which permission to use. 
    // The way you resolve this is you get all the groups, get the relevant permissions, and check them one at a time until something passes.
    // This way the user's permissions are the union of all his group's permissions.
    await client.query(
        'CREATE TABLE org_data.users(user_id SERIAL PRIMARY KEY, name text);'
    );
    // junction table connecting user to group
    // cannot have multiple connections between the same pair of user and group.
    await client.query(
        'CREATE TABLE org_data.user_groups(user_id integer REFERENCES org_data.users, \
            group_id integer REFERENCES org_data.groups, PRIMARY KEY (user_id, group_id));'
    );
    // junction table of auth key, wallet, and user
    await client.query(
    'CREATE TABLE org_data.auth_wallet_pairs(auth_address bytea PRIMARY KEY, wallet_address bytea REFERENCES org_data.wallets, \
    user_id integer REFERENCES org_data.users);');
} catch(err) {
    console.log(err);
} finally{
    await client.end();
}
})();

