'use strict';

var router = require('express').Router(),
  config = require('../conf/config'),
  datasource = require('../conf/datasource'),
  models = require('../models'),
  LoginAttempt,
  workflowService = require('../services/WorkflowService'),
  async = require('async'),
  passport = require('passport'),
  userTokenService = require('../services/UserTokenService'),
  userService = require('../services/UserService')
  ;

function loginUserAndGenerateToken(user, req, res, next) {
  req.user = user;
  userTokenService.createUserToken(user._id, function (err, token) {
    if (err) {
      return next(err);
    } else {
      res.render('success', {token : token});
    }
  });
}

// EASY XDM
//////////////////////////////
//////////////////////////////

router.get(config.routes.auth.blank, function (req, res) {
  res.render('blank');
});

router.get(config.routes.auth.name, function (req, res) {
  res.render('name');
});


// LOGIN OPTIONS
//////////////////////////////
//////////////////////////////

router.get(config.routes.auth.login, function (req, res) {

  res.render('login', {
    oauthTwitter : (config.oauth.twitter.key ? config.routes.auth.path + config.routes.auth.twitter.login : ''),
    oauthGitHub : (config.oauth.github.key ? config.routes.auth.path + config.routes.auth.github.login : ''),
    oauthFacebook : (config.oauth.facebook.key ? config.routes.auth.path + config.routes.auth.facebook.login : ''),
    oauthGoogle : (config.oauth.google.key ? config.routes.auth.path + config.routes.auth.google.login : ''),
    formLogin : (config.auth.formLoginEnabled  ? config.routes.auth.path + config.routes.auth.login : '')
  });

});

// EMAIL LOGIN
//////////////////////////////
//////////////////////////////

router.post(config.routes.auth.login, function (req, res, next) {

  var workflow = workflowService(function (data) {
    if (data && data.success) {
      userTokenService.createUserToken(req.user.username, function (err, token) {
        if (err) {
          res.send(500)
        } else {
          res.send({token : token});
        }
      })
    } else if (data.errors && data.errors.length) {
      res.status(400).send(data.errors);
    } else {
      res.send(config.auth.codes.unauthorized);
    }
  });

  workflow.on('validate', function () {

    if (!req.body.username || !req.body.password) {
      workflow.outcome.errors.push('username and password are required');
    }
    if (workflow.hasErrors()) {
      return workflow.emit('response');
    }
    workflow.emit('abuseFilter');
  });

  workflow.on('abuseFilter', function () {
    var getIpCount = function (done) {
      models.loginAttempt.countByIp(req.ip, function(err, count){
        if (err) {
          return done(err);
        }
        done(null, count);
      });
    };

    var getIpUserCount = function (done) {
      models.loginAttempt.countByIpAndUsername(req.ip, req.body.username, function(err, count){
        if (err) {
          return done(err);
        }
        done(null, count);
      });
    };

    var asyncFinally = function (err, results) {
      if (err) {
        return workflow.emit('exception', err);
      }
      if (results.ip >= config.auth.loginAttempts.forIp || results.ipUser >= config.auth.loginAttempts.forIpAndUser) {
        workflow.outcome.errors.push('You\'ve reached the maximum number of login attempts. Please try again later.');
        return workflow.emit('response');
      } else {
        workflow.emit('attemptLogin');
      }
    };

    async.parallel({ ip : getIpCount, ipUser : getIpUserCount }, asyncFinally);
  });

  workflow.on('attemptLogin', function () {
    passport.authenticate('local', function (err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (!user) {
        var fieldsToSet = { ip : req.ip, user : req.body.username };
        LoginAttempt.create(fieldsToSet, function (err) {
          if (err) {
            return workflow.emit('exception', err);
          }

          workflow.outcome.errors.push('Username and password combination not found or your account is inactive.');
          return workflow.emit('response');
        });
      } else {
        req.user = user;
        workflow.emit('response');
      }
    })(req, res, next);
  });

  workflow.emit('validate');
});



// FACEBOOK
//////////////////////////////
//////////////////////////////

router.get(config.routes.auth.facebook.login, passport.authenticate('facebook', { callbackURL : config.routes.auth.path + config.routes.auth.facebook.callback, display: 'popup' }));

router.get(config.routes.auth.facebook.callback, function (req, res, next) {

  passport.authenticate('facebook', function (err, user, info) {

    if (err) return next(err);

    if (!info || !info.profile) {
      return res.redirect(config.routes.auth.path + config.routes.auth.login);
    }

    userService.getFacebookUser(info.profile, function (err, usr) {
      if (err) {
        return next(err);
      }
      loginUserAndGenerateToken(usr, req, res, next);
    });

  })(req, res, next);

});



// GOOGLE
//////////////////////////////
//////////////////////////////

router.get(config.routes.auth.google.login, passport.authenticate('google', { callbackURL : config.routes.auth.path + config.routes.auth.google.callback, scope : ['profile email'] }));

router.get(config.routes.auth.google.callback, function (req, res, next) {
  passport.authenticate('google', function (err, user, info) {
    if (err) return next(err);

    if (!info || !info.profile) {
      return res.redirect(config.routes.auth.path + config.routes.auth.login);
    }

    userService.getGoogleUser(info.profile, function (err, usr) {
      if (err) {
        return next(err);
      }
      loginUserAndGenerateToken(usr, req, res, next);
    });

  })(req, res, next);
});



// TWITTER
//////////////////////////////
//////////////////////////////

router.get(config.routes.auth.twitter.login, passport.authenticate('twitter', { callbackURL : config.routes.auth.path + config.routes.auth.twitter.callback }));

router.get(config.routes.auth.twitter.callback, function (req, res, next) {
  passport.authenticate('twitter', function (err, user, info) {
    if (!info || !info.profile) {
      return res.redirect(config.routes.auth.path + config.routes.auth.login);
    }

    userService.getTwitterUser(info.profile, function (err, usr) {
      if (err) {
        return next(err);
      }
      loginUserAndGenerateToken(usr, req, res, next);
    });

  })(req, res, next);
});

// GITHUB
//////////////////////////////
//////////////////////////////

router.get(config.routes.auth.github.login, passport.authenticate('github', { callbackURL : config.routes.auth.path + config.routes.auth.github.callback }));

router.get(config.routes.auth.github.callback, function (req, res, next) {
  passport.authenticate('github', function (err, user, info) {
    if (!info || !info.profile) {
      return res.redirect(config.routes.auth.path + config.routes.auth.login);
    }

    userService.getGithubUser(info.profile, function (err, usr) {
      if (err) {
        return next(err);
      }
      loginUserAndGenerateToken(usr, req, res, next);
    });
  })(req, res, next);
});


// LOGOUT
//////////////////////////////
//////////////////////////////

router.get(config.routes.auth.logout, function (req, res, next) {

  function logout() {
    req.logout();
    res.status(200).end();
  }

  if (req.user._id) {
    userTokenService.deleteUserTokens(req.user._id, function (err) {
      if (err) {
        return next(err);
      }
      logout();
    });
  } else {
    logout();
  }

});

module.exports = router;
