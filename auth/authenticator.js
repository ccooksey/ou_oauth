// Module to register a new user, and to authenticate (login) an existing one.
// Note on strategy -if the interaction with the database is a success and we
// know what the outcome of any transaction is, report the outcome as a single
// word in the message, and do not return an error. Anything else report as a
// message 'error' with any supporting error data we can find in the error field.
// Note that app.oauth.grant() is used for login and I have no control over it.
// It returns a 500 error for invalid credentials even though everything
// worked perfectly. The user client must be aware of this strategy and have
// special case code for it.

let userDB;
let tokenDB;

module.exports = (injectedUserDB, injectedTokenDB) => {
    userDB = injectedUserDB;
    tokenDB = injectedTokenDB;
    return {
        registerUser,
        token,
        revoke,
        introspect,
    };
};

function registerUser(req, res) {

    // I don't think this is reentrant. If two people with the same ID were to
    // register at the same time it could allow both to "succeed". Perhaps there
    // is something inherent in React to prevent this, but I haven't seen anything
    // to indicate that this is the case.

    console.log("authenticator.js: registerUser: called");

    // Register the new user if and only if they are not already registered.
    // isValidUser is horribly named. If true, it means that the user is *not* in
    // the database.
    userDB.isValidUser(req.body.username, req.body.eaddress, (error, isValidUser) => {
 
        console.log("authenticator.js: registerUser: isValidUser: callback: error = ", error, " isValidUser = ", isValidUser);

        if (error != null) {
            sendResponse(res, 'error', error);
            return;
        }

        if (!isValidUser) {
            sendResponse(res, 'duplicate', null);
            return;
        }

        // Register the new user
        userDB.register(req.body.username, req.body.eaddress, req.body.password, (response) => {
 
            console.log("authenticator.js: registerUser: isValidUser: callback: userDB.register callback response = ", response);
 
            if (response.error != null) {
                sendResponse(res, 'error', response.error);
                return;
            }
                
            sendResponse(res, 'registered', null);
        });
    });
}

// Take a look at routes.js. app.oauth.grant() will be called before this. If this is
// reached, the user has already been authenticated. This can be used for additional
// validation possibly. Sadly, I have never seen this called. I don't think it is
// working right.
function token(req, res) {

    console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');
    console.log('authenticator.js: token: called');
    console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');
}

// Allow a user to sign out by deleting their token.
function revoke(req, res) {

    console.log('authenticator.js: revoke: called');
    console.log('authenticator.js: revoke: input token = ', req.body.token);

    // Delete the token
    tokenDB.deleteAccessToken(req.body.token, (error) => {
 
        console.log('authenticator.js: revoke: tokenDB.revokeToken: callback error = ', error);

        if (error != null) {
            sendResponse(res, 'error', error);
            return;
        }

        sendResponse(res, 'revoked', null);
    });
}

// Access point for a protected resource to validate the token it was given by the client.
// See https://www.oauth.com/oauth2-servers/token-introspection-endpoint/
function introspect(req, res) {

    // Note that according to:
    // https://connect2id.com/products/server/docs/api/token-introspection#client-authorization
    // the Authorization field is an access token granted from the Authorization
    // Server to the protected resource. It is _not_ the client token we are trying to inspect
    // (or, as we shall see later, revoke). The client token we are trying to inspect is in the
    // token parameter. Note that the client must include its token in an Authorize header
    // for every call to the protected resource.
    //
    // How to call:
    //
    // fetch('http://localhost:8801/auth/register', {
    //     method: "DELETE",
    //     cache: "no-cache",
    //     headers: {
    //       'Content-Type': 'application/x-www-form-urlencoded',
    //       'Authorization': 'Bearer' + 'protectedresourcetoken',
    //     },
    //     body: new URLSearchParams({
    //       'token': req.body.token, 
    //     }),
    // })
    // .then((r) => {
    //
    // Returns:
    // HTTP/1.1 200 OK
    // Content-Type: application/json; charset=utf-8
    // {
    //   "active": true,
    //   "scope": "read write email",
    //   "client_id": "J8NFmU4tJVgDxKaJFmXTWvaHO",
    //   "username": "aaronpk",
    //   "exp": 1437275311
    // }

    console.log('authenticator.js: introspect: called');
    console.log('authenticator.js: introspect: input token = ', req.body.token);

    // Fetch the client_id belonging to the token. This will be proof enough
    // that the token actually exists. We can return other information as well.
    tokenDB.getUserIDFromAccessToken(req.body.token, (userID) => {
 
        console.log('authenticator.js: introspect: tokenDB.getUserIDFromAccessToken: callback token = ', req.body.token);

        introspectionResponse = {
            active: userID != null,
            scope: "all",
            client_id: userID,
        };

        console.log('authenticator.js: introspect: tokenDB.getUserIDFromAccessToken: reponse = ', introspectionResponse);

        // Note that we are sending a complex object for Introspection, not just a single
        // message. Introspection wants details!
        // https://datatracker.ietf.org/doc/html/rfc7662#section-2.2
        res.status(userID == null ? 401 : 200).json({
            response: introspectionResponse,
        });
    });
}

// Utility function to attach the generated message and error to the result.
function sendResponse(res, message, error) {
    res.status(error != null ? 400 : 200).json({
        message: message,
        error: error,
    });
}
