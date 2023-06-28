// Wrapper around token-related database calls (like adding a new user to the database)
// See userDB for notes about how this functions.

let dbPool;

module.exports = (injectedDbPool) => {
    dbPool = injectedDbPool;
    return {
        saveAccessToken,
        deleteAccessToken,
        getUserIDFromAccessToken,
    };
};

// Save the access token into the public.access_tokens table
function saveAccessToken(accessToken, userID, cbFunc) {

    console.log("tokenDB.js: saveAccessToken: called");
    console.log("tokenDB.js: saveAccessToken: input accessToken = ", accessToken);
    console.log("tokenDB.js: saveAccessToken: input userID = ", userID);

    const query = 'INSERT INTO access_tokens (access_token, user_id) VALUES ($1, $2);';
    const values = [accessToken, userID];

    const queryCbFunc = (response) => {
 
        console.log("tokenDB.js: saveAccessToken: callback response", response);

        // saveAccessToken() is not documented. I strongly suspect that this is
        // not the right return object. 
        cbFunc(response.error);
    };

    dbPool.query(query, values, queryCbFunc);
}

// Delete the specified access token into the public.access_tokens table
function deleteAccessToken(accessToken, cbFunc) {

    console.log("tokenDB.js: deleteAccessToken: called");
    console.log("tokenDB.js: deleteAccessToken: input accessToken = ", accessToken);

    const query = 'DELETE FROM access_tokens WHERE access_token = $1';
    const values = [accessToken];

    const queryCbFunc = ((response) => {
    
        console.log("tokenDB.js: deleteAccessToken: callback response", response);

        cbFunc(response.error);
    });

    dbPool.query(query, values, queryCbFunc);
}
    
// Given an access token, search the public.access_token table for the user's ID
// This should return a lot more than the user_id. We could support introspection
// a heck of a lot better with more information.
function getUserIDFromAccessToken(accessToken, cbFunc) {

    console.log("tokenDB.js: getUserIDFromAccessToken: called");
    console.log("tokenDB.js: getUserIDFromAccessToken: input bearerToken = ", accessToken);

    const query = 'SELECT * FROM access_tokens WHERE access_token = $1;';
    const values = [accessToken];

    const queryCbFunc = ((response) => {

        console.log("tokenDB.js: getUserIDFromAccessToken: callback response", response);

        const userID =
            response?.rowCount === 1 ?
            response?.rowData[0].user_id :
            null;
        cbFunc(userID);
    });

    dbPool.query(query, values, queryCbFunc);
}
