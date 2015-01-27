'use strict';

var environment = (process.env.NODE_ENV || 'development');

var cfg = {

  app : {
    name : 'datadump'
  },

  db: {
    prefix: 'datadump_'
  },

  port : process.env.PORT || 8080,

  oauth : {
    twitter : {
      key : process.env.TWITTER_OAUTH_KEY,
      secret : process.env.TWITTER_OAUTH_SECRET,
      callbackURL : function(){
        return cfg.routes.app.url + cfg.routes.auth.path + cfg.routes.auth.twitter.callback
      }
    },
    facebook : {
      key : process.env.FACEBOOK_OAUTH_KEY,
      secret : process.env.FACEBOOK_OAUTH_SECRET,
      callbackURL : function(){
        return cfg.routes.app.url + cfg.routes.auth.path + cfg.routes.auth.facebook.callback
      }
    },
    github : {
      key : process.env.GITHUB_OAUTH_KEY,
      secret : process.env.GITHUB_OAUTH_SECRET,
      callbackURL : function(){
        return cfg.routes.app.url + cfg.routes.auth.path + cfg.routes.auth.github.callback
      }
    },
    google : {
      key : process.env.GOOGLE_OAUTH_KEY,
      secret : process.env.GOOGLE_OAUTH_SECRET,
      callbackURL : function(){
        return cfg.routes.app.url + cfg.routes.auth.path + cfg.routes.auth.google.callback
      }
    }
  },

  auth : {
    formLoginEnabled : true,
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
      secret : process.env.REST_TOKEN_SECRET || '123456'
    },
    roleConfig : [
      'ROLE_SUPERADMIN > ROLE_ADMIN',
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
      url : 'http://localhost:8080'
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


switch (environment){
  case 'production':
    cfg.routes.app.url = 'http://myservice.io';
    break;
}

module.exports = cfg;
