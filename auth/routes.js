// Note that this is attaching a set of routes off of /auth. i.e.
// /auth/register, /auth/token, etc.

module.exports = (router, app, authenticator) => {

    // User registration does not seem to be a focus of OAuth 2.0. From
    // what I have read it's pretty much "roll your own".
    router.post("/register", authenticator.registerUser);
 
    // This is a chained callback. If app.oauth.grant() does not call "next",
    // then authenticator.login will be called. I have never seen 
    // authenticator.login get called. I don't yet know why.

    // Same as "logging in". Generates a new bearer token. It looks like
    // it will be acceptable just to use the oauth grant API.
    router.post("/token", app.oauth.grant(), authenticator.token);

    // Same as logging out. Removes all tokens associated with a given client id
    router.delete("/token/revoke", authenticator.revoke);

    // Used by protected resource server to authenticate the bearer token
    // (not necessarily the client, but we can call this from there as well).
    // Ultimately will want to use scoping rules to prevent that.
    router.post("/token/introspect", authenticator.introspect);

    return router;
};
