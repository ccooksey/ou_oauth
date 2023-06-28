// Example code followed for this project was found at:
// https://blog.logrocket.com/implement-oauth-2-0-node-js/

// Database imports
// Must be run with "npm run start:prod" or "npm run start:dev" for this to work
const path = require('node:path');
require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
const database = require(process.env.SERVER_DATABASE_WRAPPER);
const tokenDB = require("./db/tokenDB")(database);
const userDB = require("./db/userDB")(database);

// Log our configuration
console.log(`NODE_ENV = ${process.env.NODE_ENV}`);
database.identifyDBWrapper();

// OAuth imports
const oAuthService = require("./auth/tokenService")(userDB, tokenDB);
const oAuth2Server = require("node-oauth2-server");

// cors
const cors = require('cors');

// Express
const express = require("express");
const app = express();

// Overwrite express's oauth server with our implementation.
app.oauth = oAuth2Server({
    model: oAuthService,   // This is key -this sets the custom callbacks used by the node-oauth2-server package
    grants: ["password"],
    debug: true,
});

// Authorization routing (/auth)
const authenticator = require("./auth/authenticator")(userDB, tokenDB);
const routes = require("./auth/routes")(
    express.Router(),
    app,
    authenticator);

// Test routing (/test)
const testAPIService = require("./test/testAPIService.js");
const testAPIRoutes = require("./test/testAPIRoutes.js")(
    express.Router(),
    app,
    testAPIService
);

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(app.oauth.errorHandler());
app.use("/auth", routes);
app.use("/test", testAPIRoutes);

// Let's listen! Seems like oauth2 does not have a standard port number
const port = 9443;
app.listen(port, () => {
    console.log(`listening on port ${port}`);
});
