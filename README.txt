A simple password grant Oauth 2.0 server.

This is an incredibly simple password-grant only Oauth 2.0 server. It uses express for API
support, node-oauth2-server for the core Oauth 2 grant flows, and pg OR mysql for database
support. You can choose which database to use via config in .env.development or .env.production.
Note that neither of these last two files exist in the project. Duplicate .env and
fill out your credentials as needed.

You will need either PostgreSQL or MySQL running on the same machine. Set the port numbers and
credentials in .env.development or .env.production.

The code can be dragged to a server somewhere and started with either

    npm run start:dev

or

    npm run start:prod

Don't just

    npm start

the server. It will not pick up a config file and will not be able to contact the backing database.

There is a React client "bsi" in my github repo that uses this server to register users and let them
sign in and out. The "bsi_server", the game server, in my github repo uses the ou_ouath server to
validate tokens passed by the bsi client to it.
