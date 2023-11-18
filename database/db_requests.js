const pg = require("pg");
const dbconfig = require("../dbconfig.json");

const pool = new pg.Pool(dbconfig);

async function query(query) {
    //const pool = await new pg.Pool(dbconfig);
    const client = await pool.connect();
    const result =  await client.query(query);
    client.release();
    return result;
}

module.exports = {query}
// create and maintain a pool of connections to the database
// allow arbitrary requests
