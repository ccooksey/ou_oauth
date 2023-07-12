My first React server!

This is an incredibly simple password-grant only Oauth 2.0 server that I put together as an exercise
to learn React. It uses express for API support, node-oauth2-server for the core Oauth 2 grant flows,
and pg and mysql for database support. You can choose which database to use via config in .env.development or
.env.production. Note that neither of these last two files exist in the project. Duplicate .env and
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
sign in and out. My hope is to add some content beyond that soon, but it is now time to get these
fledgling efforts safely under source control.
