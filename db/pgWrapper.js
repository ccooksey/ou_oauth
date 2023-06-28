// Simple PostgresSQL wrapper.

// Make a PostgresSQL asynchronous call using queryString.
// When it completes, call cbFunc with the results.
// This should work no matter what machine we are hosted on
// as long as psql is running on the local machine. Port 5432
// is not open to the internet so there is no danger of someone
// directly accessing psql from outside the NAT. There is,
// of course, a danger that someone takes control of the machine,
// but we have bigger problems if they figure out how to do that.
// Fun fact: local host connections ignore the password. See
// https://www.postgresql.org/docs/current/auth-pg-hba-conf.html
// for how to make that more secure if desired.

// Must be run with "npm run start:prod" or "npm run start:dev"
// for this to work. Note that files .env.development and .env.production
// must be maunally added as peers to .env (which itself is never
// used). These files will contain real login info for the databases
// to be used. They are not committed to git because they have real
// credentials in them.
const path = require('node:path');
require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });

function identifyDBWrapper() {
    console.log("Using PostgreSQL");
}

const Pool = require("pg").Pool;

const pool = new Pool({
    host: `${process.env.SERVER_DB_HOST}`,
    port: process.env.SERVER_DB_PORT,
    user: `${process.env.SERVER_DB_USER}`,
    password: `${process.env.SERVER_DB_PASSWORD}`,
    database: `${process.env.SERVER_DB_DATABASE}`,
    max: process.env.SERVER_DB_CONNECTION_LIMIT,
});

function query(queryString, values, cbFunc) {

    console.log("pgWrapper.js: query: input queryString = ", queryString);
    console.log("pgWrapper.js: query: input values = ", values);

    pool.query(queryString, values, (error, results) => {

        console.log("pgWrapper.js: query done: error = ", error);
        console.log("pgWrapper.js: query done: results = ", results);

        const response = setResponse(error, results);
        console.log("pgWrapper.js: query done: response = ", response);

        cbFunc(response);
    });
}

function setResponse(error, results) {

    // The db response varies wildly depending on the db and db access
    // framework used. We will normalize them before returning them.

    // Note that pgsql will return an empty rows array, but a rowCount > 0
    // upon a successful insert. You need to add a RETURNING clause to the
    // INSERT to get the data, but of course MySQL does not support that.
    // It does not affect the operation of anything to omit it like we do here,
    // but be aware.

    return {
        error: error != null ? error : null,
        rowCount: results?.rowCount != null ? results.rowCount : 0,
        rowData: results?.rows != null ? results.rows : [],
    };
}

module.exports = {
    identifyDBWrapper,
    query,
};
