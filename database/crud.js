// only connect to the database once, then make all function calls through this file
import {Client} from 'pg';
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/mydb';

const client = new Client(connectionString);
await client.connect();

module.exports = {client}