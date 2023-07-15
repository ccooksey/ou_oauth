// Simple MySQL wrapper.

// Make a MySQL asynchronous call using queryString.
// When it completes, call cbFunc with the results.
// This should work no matter what machine we are hosted on
// as long as psql is running on the local machine. Port 5432
// is not open to the internet so there is no danger of someone
// directly accessing psql from outside the NAT. There is,
// of course, a danger that someone takes control of the machine,
// but we have bigger problems if they figure out how to do that.

// Must be run with "npm run start:prod" or "npm run start:dev"
// for this to work. Note that files .env.development and .env.production
// must be maunally added as peers to .env (which itself is never
// used). These files will contain real login info for the databases
// to be used. They are not committed to git because they have real
// credentials in them.
const path = require('node:path');
require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });

function identifyDBWrapper() {
    console.log("Using MySQL");
}

const mysql = require("mysql");

const pool = mysql.createPool({
    host: `${process.env.DATABASE_HOST}`,
    port: process.env.DATABASE_PORT,
    user: `${process.env.DATABASE_USER}`,
    password: `${process.env.DATABASE_PASSWORD}`,
    database: `${process.env.DATABASE_DATABASE}`,
    connectionLimit: process.env.DATABASE_CONNECTION_LIMIT,
});

function query(queryString, values, cbFunc) {

    console.log("myWrapper.js: query: input queryString = ", queryString);
    console.log("myWrapper.js: query: input values = ", values);

    // Convert PostgreSQL style query string into a MySQL style query string. e.g
    // 'SELECT * FROM users WHERE username = $1 OR eaddress = $2' becomes
    // 'SELECT * FROM users WHERE username = ? OR eaddress = ?'.
    var mysqlQuery = queryString.replace(/\$[0-9]*/g, '?');
    console.log("myWrapper.js: query: modified queryString = ", mysqlQuery);

    pool.query(mysqlQuery, values, (error, results) => {
 
        console.log("myWrapper.js: query done: error = ", error);
        console.log("myWrapper.js: query done: results = ", results);

        const response = setResponse(error, results);
        console.log("myWrapper.js: query done: response = ", response);

        cbFunc(response);
    });
}

function setResponse(error, results) {

    // The db response varies wildly depending on the db and db access
    // framework used. We will normalize them before returning them.

    return {
        error: error,
        rowCount: results?.length != null ? results.length : 0,
        rowData: rowData = results != null ? JSON.parse(JSON.stringify(results)) : [],
    };
}

module.exports = {
    identifyDBWrapper,
    query,
};

