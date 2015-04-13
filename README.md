# datadump

[![Build Status](https://travis-ci.org/ivarprudnikov/datadump.svg?branch=master)](https://travis-ci.org/ivarprudnikov/datadump)

Network application for data aggregation via HTTP REST based API endpoints.

## Internals

This server app is stateless - there is no session.

### Datasource

Application datasource is MongoDB. It is tightly integrated with the help of Mongoose.

Data is split into couple of models, ones representing users and others - managed data. Managed data is expected
to be stored within buckets which represent resources, each data item is called bucketItem and is not expected to 
be a blob.

### Authentication

HTTP API is designed to use bearer tokens which are expected to be in headers of every request of protected resource.
Tokens are retrieved either via username-password post request to dedicated endpoint 
(usually only for bootstrapped users) or via 3rd party authentication providers (Facebook, Twitter, Google, Github).
Authentication using 3rd party can only be done with a browser as authentication involves opening popup windows.


## Running the app

### Prerequisites

- node.js
- mongoDB

### Launching

- ensure you are in project dir
- ensure `mongod` process is running, by default it is expected to run locally on port (27017) without usr/pass
- run `npm install && npm start`

### Testing

- ensure you are in project dir
- ensure `mongod` process is running
- run `npm test`

