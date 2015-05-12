# datadump - in progress

Network application for data aggregation via HTTP REST based API endpoints.

## Internals

This server app is stateless - there is no session.

### Datasource

Application datasource is Cassandra.

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
- cassandra

### Launching

- ensure you are in project dir
- ensure `cassandra` is running, by default it is expected to run locally
- ensure that schema commands which are in server/models/schema.txt are applied `cqlsh > server/models/schema.txt`
- run `npm install && npm start`

### Environmental variables - config

Expected environmental variables:

- `NODE_ENV` - development(default), test, production


- `APP_ENV_VAR_PREFIX` - `APP_`(default), can override to avoid environmental variable pollution, then every
subsequent variable will expect this prefix.
- `APP_NAME` - datadump(default), will be used as default db_collection_prefix
- `APP_PROTOCOL` - http(default)
- `APP_FQDN` - localhost(default)
- `APP_PORT` - 8080(default)
- `APP_REST_TOKEN_SECRET`
- `APP_FORM_LOGIN_ENABLED` - whether to enable username/password based login over api, to enable pass `true`,
it is enabled by default in `test` and `development` environments
- `APP_SETUP_ADMIN` - if you want to setup admin user then enable this one, to enable pass `true`.
Also you might want to enable form login as otherwise there will be no way to log in. Admin user will have 
the right to observe and modify submitted data.
- `APP_ADMIN_USERNAME` - default is `admin`
- `APP_ADMIN_PASSWORD` - default is `123456`
- `APP_ADMIN_OVERWRITE_PASSWORD` - to enable pass `true`, enabled by default in `test` and `development` environments.
In case where admin is set to be created, on startup application will try to find one with the username provided,
if it does not find one then new admin user is created, otherwise it will either overwrite existing password or leave it
unchanged.
- `APP_DB_URI`
- `APP_DB_USER`
- `APP_DB_PASSWORD`
- `APP_DB_COLLECTION_PREFIX` - collections stored in mongo will have this prefix
- `APP_TWITTER_OAUTH_KEY`
- `APP_TWITTER_OAUTH_SECRET`
- `APP_FACEBOOK_OAUTH_KEY`
- `APP_FACEBOOK_OAUTH_SECRET`
- `APP_GITHUB_OAUTH_KEY`
- `APP_GITHUB_OAUTH_SECRET`
- `APP_GOOGLE_OAUTH_KEY`
- `APP_GOOGLE_OAUTH_SECRET`



### Testing

not fixed yet

