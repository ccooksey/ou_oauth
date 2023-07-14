// Example code followed for this project was found at:
// https://blog.logrocket.com/implement-oauth-2-0-node-js/

const fs = require('fs');
const https = require('https');
const dotenv = require('dotenv');

// Must be run with "npm run start:prod" or "npm run start:dev" for this to work
dotenv.config({ path: `./.env.${process.env.NODE_ENV}` });

// Database imports
const database = require(process.env.SERVER_DB_WRAPPER);
const tokenDB = require("./db/tokenDB")(database);
const userDB = require("./db/userDB")(database);

// OAuth imports
const oAuthService = require('./auth/tokenService')(userDB, tokenDB);
const oAuth2Server = require('node-oauth2-server');

// Express
const express = require("express");
const cors = require('cors');

// Log our configuration
console.log(`NODE_ENV = ${process.env.NODE_ENV}`);
database.identifyDBWrapper();
console.log(`Server located at ${__dirname}`);

const app = express();

// Overwrite express's oauth server with our implementation.
app.oauth = oAuth2Server({
    model: oAuthService,   // This is key -this sets the custom callbacks used by the node-oauth2-server package
    grants: ["password"],
    debug: true,
});

// Authorization routing (/auth)
const authenticator = require("./auth/authenticator")(userDB, tokenDB);
const routes = require("./auth/routes")(express.Router(), app, authenticator);

// Test routing (/test)
const testAPIService = require("./test/testAPIService.js");
const testAPIRoutes = require("./test/testAPIRoutes.js")(express.Router(), app, testAPIService);

// Restrict CORS access as much as desired
const corsOptions = { 
    origin: process.env.SERVER_ALLOWED_ORIGINS,
    methods: 'POST, DELETE, OPTIONS' 
}
app.use(cors(corsOptions));
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(app.oauth.errorHandler());
app.use("/auth", routes);
app.use("/test", testAPIRoutes);

function Development() {
    return (!process.env.NODE_ENV || process.env.NODE_ENV === 'development');
}

// Let's listen!
if (Development()) {
    app.listen(process.env.SERVER_PORT_HTTP, () => {
        console.log(`HTTP server listening on port ${process.env.SERVER_PORT_HTTP}`)
    });
} else {
    const options = {
        key: fs.readFileSync(process.env.SERVER_PRIVATE_KEY_PATH),
        cert: fs.readFileSync(process.env.SERVER_FULL_CHAIN_PATH)
    }
    https.createServer(options, app).listen(process.env.SERVER_PORT_HTTPS, () => {
        console.log(`HTTPS server listening on port ${process.env.SERVER_PORT_HTTPS}`)
    });
}
