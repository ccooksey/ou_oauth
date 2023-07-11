// Wrapper around user-related database calls (like adding a new user to the database)

let dbPool;

module.exports = (injectedDbPool) => {
    dbPool = injectedDbPool;
    return {
        register,
        getUser,
        isValidUser,
        getUserDetailsFromUserID,
    };
};

var crypto = require("crypto");

// Add a user to the public.users table. Call cbFunc when done. Note that we check
// whether the user already exists before calling this.
function register(username, eaddress, password, cbFunc) {

    console.log("userDB.js: register: called");
    console.log("userDB.js: register: input username = ", username);
    console.log("userDB.js: register: input eaddress = ", eaddress);
    console.log("userDB.js: register: input password = ", password);

    var shaPass = crypto.createHash('sha256').update(password).digest('hex');
    const query = 'INSERT INTO users (username, eaddress, password) VALUES($1, $2, $3);';
    const values = [username, eaddress, shaPass];

    // We are just passing the db results straight through to registerUser. But
    // we own that -not oauth2. registerUser just needs to be aware of the normalized
    // data format that the db wrapper modules are returning.
    const queryCbFunc = (response) => {
 
        console.log("userDB.js: register: callback response", response);

        cbFunc(response);
    };

    dbPool.query(query, values, queryCbFunc);
}

// Verify that the user is present in db table "users", and that the password provided
// matches. Return the username from the database (even if the user email address was
// used to login).
function getUser(username, password, cbFunc) {

    console.log("userDB.js: getUser: called");
    console.log("userDB.js: getUser: input username = ", username);
    console.log("userDB.js: getUser: input password = ", password);

    var shaPass = crypto.createHash('sha256').update(password).digest('hex');
    const query = 'SELECT * FROM users WHERE (username = $1 OR eaddress = $2) AND password = $3;';
    const values = [username, username, shaPass];

    const queryCbFunc = (response) => {

        console.log("userDB.js: getUser: callback response", response);

        // NB: other functions belonging to us will eventually receive rowData[0].
        // The Oauth2 framework we are using never inspects the data. Currently it
        // is an object with all the key value pairs for a user straight out of the
        // "users" table in the db.
        const foundUser =
            response?.rowCount === 1 ?
            response?.rowData[0] :
            null;

        console.log("userDB.js: getUser: callback: returning foundUser", foundUser);

        cbFunc (false, foundUser);
    };

    dbPool.query(query, values, queryCbFunc);
}

// Check if the user can be added to the public.users table. If they aren't already
// in the table, and the name is acceptable, return true. If the user already exists,
// return false.
function isValidUser(username, eaddress, cbFunc) {

    console.log("userDB.js: isValidUser: called");
    console.log("userDB.js: isValidUser: input username = ", username);
    console.log("userDB.js: isValidUser: input eaddress = ", eaddress);

    const query = 'SELECT * FROM users WHERE (username = $1 OR eaddress = $2);';
    const values = [username, eaddress];

    const queryCbFunc = (response) => {

        console.log("userDB.js: isValidUser: queryCbFunc: response = ", response);

        // Return true if nothing went wrong, but the user was NOT found. If we
        // return true, we might be inserting the user into the database next.
        // We only want to attempt that if nothing went wrong during the search.
        const isValidUser =
            response?.error == null &&
            response?.rowCount === 0;

        cbFunc(response.error, isValidUser);
    };

    dbPool.query(query, values, queryCbFunc);
}

function getUserDetailsFromUserID(userID, cbFunc) {

    console.log("userDB.js: getUserDetailsFromUserID: called");
    console.log("userDB.js: getUserDetailsFromUserID: input userID = ", userID);

    const query = 'SELECT * FROM users WHERE (id = $1);';
    const values = [userID];

    const queryCbFunc = (response) => {

        console.log("userDB.js: getUserDetailsFromUserID: queryCbFunc: response = ", response);

        const result = response?.error == null && response?.rowCount === 1 ?
            {username: response.rowData[0]?.username,
             eaddress: response.rowData[0]?.eaddress} : null;

        console.log("userDB.js: getUserDetailsFromUserID: queryCbFunc: result = ", result);

        cbFunc(response.error, result);
    };

    dbPool.query(query, values, queryCbFunc);
}