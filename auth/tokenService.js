// Overwritten versions of the Model Specification contract
// https://oauth2-server.readthedocs.io/en/latest/model/spec.html
// Note that the documentation is not correct in number of areas.
// These are the ones that the model says we need to override for password grant:
//
// generateAccessToken(client, user, scope, [callback])
// generateRefreshToken(client, user, scope, [callback])
// getClient(clientId, clientSecret, [callback])
// getUser(username, password, [callback])
// saveToken(token, client, user, [callback])
// validateScope(user, client, scope, [callback])
//
// userDB and tokenDB are injected modules userDB.js and tokenDB.js
// Must be done like this for testing purposes instead of just importing
// the modules.

// See index.js where we say app.oauth = oAuth2Server({... This model is injected
// into the oAuth2Server object which in turn overrides the Express implementation of
// OAuth2. We receive calls from oAuth2Server as express navigates to various routes.
// Note how our overrides essentially manipulate names and tokens in the backing database.

// Required OAuth2 password grant overrides for package node-oauth2-server
// (see https://oauth2-server.readthedocs.io/en/latest/model/spec.html#model-specification)
//  * [req]  getAccessToken(accessToken, [callback])
//  * [req]  getClient(clientId, clientSecret, [callback])
//  * [req]  getUser(username, password, [callback])
//  * [req]  saveToken(token, client, user, [callback])

let userDB;
let tokenDB;

module.exports = (injectedUserDB, injectedTokenDB) => {
    userDB = injectedUserDB;
    tokenDB = injectedTokenDB;
    return {
        getAccessToken,     // override. Called by generateAccessToken()
        getClient,          // override.
        getUser,            // override.
        saveAccessToken,    // override. Called by saveToken()
        grantTypeAllowed,   // possibly called by validateScope() or others.
    };
};

function getAccessToken(accessToken, cbFunc) {

    console.log("--> tokenService.js: getAccessToken called");
    console.log("--> tokenService.js: getAccessToken: accToken = ", accessToken);

    const myCbFunc = ((clientID) => {

        console.log("--> tokenService.js: getAccessToken: callback: userID = ", clientID);

        // Missing all kinds of info unfortunately. Definite room for improvement
        // Note that node-oauth2-server looks for 'user', not 'client' (contrary to the
        // documentation).
        const token = {
            user: {
                id: clientID
            },
        };

        console.log("--> tokenService.js: getAccessToken: callback: returning token = ", token);
    
        cbFunc(clientID === null, clientID === null ? null : token);
    });

    tokenDB.getUserIDFromAccessToken(accToken, myCbFunc);
}

function getClient(clientID, clientSecret, cbFunc) {

    console.log("--> tokenService.js: getClient called");
    console.log("--> tokenService.js: getClient: clientID = ", clientID);
    console.log("--> tokenService.js: getClient: clientSecret = ", clientSecret);

    const client = {
        clientID,
        clientSecret,
        grants: null,
        redirectUris: null,
    };

    console.log("--> tokenService.js: getClient: returning client = ", client);

    cbFunc(false, client);
}

function getUser(username, password, cbFunc) {

    console.log("--> tokenService.js: getUser called");
    console.log("--> tokenService.js: getUser: username = ", username);
    console.log("--> tokenService.js: getUser: password = ", password);

    userDB.getUser(username, password, cbFunc);
}

// This does not match any explicitly required override. However,
// saveToken(token, client, user, [callback]) calls saveAccessToken
// (as well as saveRefreshToken). The latter is not needed for password
// grant so it is apparently ok to override only saveAccessToken.
// Note: user is the object returned by userDB.js:getUser.
function saveAccessToken(accessToken, clientID, expires, user, cbFunc) {

    console.log("--> tokenService.js: saveAccessToken called");
    console.log("--> tokenService.js: saveAccessToken: accessToken = ", accessToken);
    console.log("--> tokenService.js: saveAccessToken: clientID = ", clientID);
    console.log("--> tokenService.js: saveAccessToken: expires = ", expires);
    console.log("--> tokenService.js: saveAccessToken: user = ", user);

    tokenDB.saveAccessToken(accessToken, user.id, cbFunc);
}

// Does not match any override, but this does not look optional!
function grantTypeAllowed(clientID, grantType, cbFunc) {

    // This might be an opportunity to verify the clientID. But
    // wouldn't the oauth2 library be doing that already?
    // We only support "password" grant types for now.

    console.log("--> tokenService.js: grantTypeAllowed called");
    console.log("--> tokenService.js: grantTypeAllowed: clientID = ", clientID);
    console.log("--> tokenService.js: grantTypeAllowed: grantType = ", grantType);

    cbFunc(false, grantType === 'password');
}
