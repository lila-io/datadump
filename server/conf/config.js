'use strict';

var environment = (process.env.NODE_ENV || 'development');

function envVar(variable){
  return process.env[appEnvVarPrefix + variable + '']
}

var appEnvVarPrefix = (process.env.APP_ENV_VAR_PREFIX || 'APP_');
var appName = (envVar('NAME') || 'datadump');
var protocol = (envVar('PROTOCOL') || 'http');
var fqdn = (envVar('FQDN') || 'localhost');
var port = (envVar('PORT') || '8080');
var restTokenSecret = (envVar('REST_TOKEN_SECRET') || '1234567890');
var _formLoginEnabledDefault = 'false';
if(environment === 'test' || environment === 'development'){
  _formLoginEnabledDefault = 'true'
}
var _formLoginEnabled = (envVar('FORM_LOGIN_ENABLED') || _formLoginEnabledDefault);
var formLoginEnabled = _formLoginEnabled.toLowerCase() === 'true';

// admin setup
var _setupAdminDefault = 'false';
if(environment === 'test' || environment === 'development'){
  _setupAdminDefault = 'true'
}
var _setupAdmin = (envVar('SETUP_ADMIN') || _setupAdminDefault);
var setupAdmin = _setupAdmin.toLowerCase() === 'true';
var adminUsername = (envVar('ADMIN_USERNAME') || 'admin');
var adminPassword = (envVar('ADMIN_PASSWORD') || '123456');
var _adminOverwritePasswordDefault = 'false';
if(environment === 'test' || environment === 'development'){
  _adminOverwritePasswordDefault = 'true'
}
var _adminOverwritePassword = (envVar('ADMIN_OVERWRITE_PASSWORD') || _adminOverwritePasswordDefault);
var adminOverwritePassword = _adminOverwritePassword.toLowerCase() === 'true';

// database
var dbContactPoints;
var _dbContactPoints = (envVar('DB_CONTACT_POINTS') || '127.0.0.1,192.168.59.103');
if(_dbContactPoints.indexOf(',')){
  dbContactPoints = _dbContactPoints.split(',')
} else {
  dbContactPoints = [_dbContactPoints];
}
var dbKeyspace = (envVar('DB_KEYSPACE') || 'datadump');
var dbProtocol = (envVar('DB_PROTOCOL') || '9160');


// oauth
var twitterOauthKey = (envVar('TWITTER_OAUTH_KEY') || '');
var twitterOauthSecret = (envVar('TWITTER_OAUTH_SECRET') || '');
var facebookOauthKey = (envVar('FACEBOOK_OAUTH_KEY') || '');
var facebookOauthSecret = (envVar('FACEBOOK_OAUTH_SECRET') || '');
var githubOauthKey = (envVar('GITHUB_OAUTH_KEY') || '');
var githubOauthSecret = (envVar('GITHUB_OAUTH_SECRET') || '');
var googleOauthKey = (envVar('GOOGLE_OAUTH_KEY') || '');
var googleOauthSecret = (envVar('GOOGLE_OAUTH_SECRET') || '');


function appUrl(){
  var url = protocol + '://' + fqdn;
  if(port !== '80'){
    url += (':' + port);
  }
  return url;
}


var cfg = {

  app: {
    name : appName
  },

  admin: {
    setupAdmin: setupAdmin,
    username: adminUsername,
    password: adminPassword,
    overwritePassword: adminOverwritePassword
  },

  db: {
    contactPoints: dbContactPoints,
    keyspace: dbKeyspace,
    protocol: dbProtocol
  },

  port : port,

  oauth : {
    twitter : {
      key : twitterOauthKey,
      secret : twitterOauthSecret,
      callbackURL : function(){
        return cfg.routes.app.url + cfg.routes.auth.path + cfg.routes.auth.twitter.callback
      }
    },
    facebook : {
      key : facebookOauthKey,
      secret : facebookOauthSecret,
      callbackURL : function(){
        return cfg.routes.app.url + cfg.routes.auth.path + cfg.routes.auth.facebook.callback
      }
    },
    github : {
      key : githubOauthKey,
      secret : githubOauthSecret,
      callbackURL : function(){
        return cfg.routes.app.url + cfg.routes.auth.path + cfg.routes.auth.github.callback
      }
    },
    google : {
      key : googleOauthKey,
      secret : googleOauthSecret,
      callbackURL : function(){
        return cfg.routes.app.url + cfg.routes.auth.path + cfg.routes.auth.google.callback
      }
    }
  },

  auth : {
    formLoginEnabled : formLoginEnabled,
    loginAttempts : {
      forIp : 50,
      forIpAndUser : 7,
      logExpiration : '20m'
    },
    codes : {
      unauthorized : 401,
      forbidden : 403
    },
    token : {
      secret : restTokenSecret
    },
    roleConfig : [
      'ROLE_ADMIN > ROLE_USER',
      'ROLE_ADMIN > ROLE_API'
    ]
  },

  staticFilesDir : '/client',

  expires : {
    year : 86400000 * 365
  },

  routes: {

    app : {
      url : appUrl()
    },

    auth : {
      path : '/api/auth',
      login : '/login',
      logout : '/logout',
      blank : '/blank',
      name : '/name',
      success : '/success',
      facebook : {
        login : '/login/facebook',
        callback : '/login/facebook/callback'
      },
      google : {
        login : '/login/google',
        callback : '/login/google/callback'
      },
      twitter : {
        login : '/login/twitter',
        callback : '/login/twitter/callback'
      },
      github : {
        login : '/login/github',
        callback : '/login/github/callback'
      }
    },

    api : {
      root : '/api',
      versionRoot : '/api/v1'
    }
  }

};

module.exports = cfg;
