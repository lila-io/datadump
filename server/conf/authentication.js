/**
 * authentication.js
 *
 * Passport module config
 * */

'use strict';

var
	conf = require('./config'),
  models = require('../models'),
	passport = require('passport'),
  datasource = require('./datasource'),
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

  // USERNAME/PASSWORD
  //////////////////////////////

  if (conf.auth.formLoginEnabled) {
    passport.use(new LocalStrategy(
      function (username, password, done) {
        process.nextTick(function () {

          models.user.findByUsername(username, function(err, user){
            if(err) {
              return done(err);
            }
            if(!user){
              return done(null, false, {message: 'Invalid username or password'});
            }
            if( true !== user.is_enabled ){
              return done(null, false, {message: 'Invalid username or password'});
            }

            models.user.compareHashedValues(password, user.password, function(err, isMatch){
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

      models.userToken.prepareSelectStatement({access_token:token},function(err,statement){

        datasource.getClient().execute(statement, null, {prepare: true}, function(err, result){

          if(err) {
            return done(err);
          }

          if(!result || result.rowLength > 1 || !result.first()){
            return done(null, false);
          }

          var row = result.first();
          var username = row.get('username');

          models.user.findByUsername(username, function(err, user){
            if(err) {
              return done(err);
            }
            if(!user){
              return done(null, false);
            }
            if( true !== user.is_enabled ){
              return done(null, false);
            }
            return done(null, user, {scope: 'all'});
          });

        });
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
