// create and maintain a pool of connections to the database
// allow arbitrary requests

const pg = require("pg");
const dbconfig = require("../dbconfig.json");

const pool = new pg.Pool(dbconfig);

async function query(query) {
    const client = await pool.connect();
    // temporarily log the query
    console.log("Received query")
    console.log(query)
    const result =  await client.query(query);
    // temporarily log the result
    console.log(result)
    client.release();
    return result;
}

module.exports = {query}
