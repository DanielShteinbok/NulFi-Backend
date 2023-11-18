const requests = require('./db_requests');
const pg = require('pg');
//import crud from './db_requests.js'
//import 'pg'

jest.mock('pg', ()=> {
    return {
        Pool: jest.fn().mockImplementation(() => { return {
            connect: jest.fn().mockImplementation(() => {
                return {query: jest.fn(), release: jest.fn()}
            })
        }})
    }
});

test('multiple requests should create only one pg.Pool', () => {
    requests.query("SELECT *;");
    requests.query("SELECT *;");
    expect(pg.Pool).toHaveBeenCalledTimes(1);
});

