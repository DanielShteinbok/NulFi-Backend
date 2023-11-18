const express = require('express');
//import express from 'express';
//import {Client} from 'pg';
const pg = require('pg');

const app = express();
const port = 3000;

const pool = new pg.Pool();

app.use(express.json());

app.get('/', (req, res) => {
  console.log("got a request");
  res.send('Hello World!');
});

app.post('/', async (req, res) => {
  console.log("Received a post request!");
  console.log(req.body);
  // check address from signedTransaction
  // check transaction against what is allowed in the database
  // add nonce to database
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
