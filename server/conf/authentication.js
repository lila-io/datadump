/**
 * authentication.js
 *
 * Passport module config
 * */

'use strict';

var
	conf = require('./config'),
	emailValidatorService = require('../services/EmailValidatorService'),
	passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
  BearerStrategy = require('passport-http-bearer').Strategy,
	TwitterStrategy = require('passport-twitter').Strategy,
	GitHubStrategy = require('passport-github').Strategy,
	FacebookStrategy = require('passport-facebook').Strategy,
	GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
	roleCompareService = require('../services/RoleCompareService')
;

exports.init = function (app) {

  console.log('Running authentication.js');

  var User
  var UserToken


  // USERNAME/PASSWORD
  //////////////////////////////

  if (conf.auth.formLoginEnabled) {
    passport.use(new LocalStrategy(
      function (username, password, done) {
        process.nextTick(function () {

          var conditions = {enabled: true};

          if ('string' === typeof username && emailValidatorService(username)) {
            conditions.email = username;
          } else {
            conditions.username = username;
          }

          User.findOne(conditions, function (err, user) {

            if (err) {
              return done(err);
            }

            if (!user) {
              return done(null, false, {message: 'Invalid username or password'});
            }

            user.comparePassword(password, function (err, isMatch) {
              if (err) {
                return done(err);
              }
              if (!isMatch) {
                return done(null, false, {message: 'Invalid username or password'});
              }
              return done(null, user);
            });

          });
        });
      }
    ));
  }

  // BEARER TOKEN
  //////////////////////////////


  passport.use(new BearerStrategy(
    function (token, done) {

      UserToken.findOne({token: token}, function (err, tokenInstance) {

        if (err) {
          return done(err);
        }
        if (!tokenInstance) {
          return done(null, false);
        }

        User.findById(tokenInstance.userId)
          .populate({path: 'authorities', select: {_id: 1, authority: 1}})
          .exec(function (err, user) {
            if (err) {
              return done(err);
            }
            if (!user) {
              return done(null, false);
            }

            var userRoles = [];
            var usrObj = user.toObject();
            for (var i = 0; i < usrObj.authorities.length; i++) {
              userRoles.push(usrObj.authorities[i].authority);
            }
            if (roleCompareService.rolesHaveAccessFor(userRoles, 'ROLE_ADMIN')) {
              usrObj.isAdmin = true;
            }

            return done(null, usrObj, {scope: 'all'});
          })

      });
    }
  ));


  // OAUTH
  //////////////////////////////


  if (conf.oauth.twitter.key) {
    passport.use(new TwitterStrategy({
        consumerKey: conf.oauth.twitter.key,
        consumerSecret: conf.oauth.twitter.secret
      },
      function (token, tokenSecret, profile, done) {
        done(null, false, {
          token: token,
          tokenSecret: tokenSecret,
          profile: profile
        });
      }
    ));
  }

  if (conf.oauth.github.key) {
    passport.use(new GitHubStrategy({
        clientID: conf.oauth.github.key,
        clientSecret: conf.oauth.github.secret,
        customHeaders: {'User-Agent': conf.app.name}
      },
      function (accessToken, refreshToken, profile, done) {
        done(null, false, {
          accessToken: accessToken,
          refreshToken: refreshToken,
          profile: profile
        });
      }
    ));
  }

  if (conf.oauth.facebook.key) {
    passport.use(new FacebookStrategy({
        clientID: conf.oauth.facebook.key,
        clientSecret: conf.oauth.facebook.secret,
        callbackURL: conf.routes.app.url + conf.routes.auth.path + conf.routes.auth.facebook.callback
      },
      function (accessToken, refreshToken, profile, done) {
        done(null, false, {
          accessToken: accessToken,
          refreshToken: refreshToken,
          profile: profile
        });
      }
    ));
  }

  if (conf.oauth.google.key) {
    passport.use(new GoogleStrategy({
        clientID: conf.oauth.google.key,
        clientSecret: conf.oauth.google.secret,
        callbackURL: conf.app.url + conf.routes.auth.path + conf.routes.auth.google.callback
      },
      function (accessToken, refreshToken, profile, done) {
        done(null, false, {
          accessToken: accessToken,
          refreshToken: refreshToken,
          profile: profile
        });
      }
    ));
  }

  app.use(passport.initialize());

};
