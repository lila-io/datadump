'use strict';

var routeAuthenticationService = require('../services/RouteAuthenticationService');
var cfg = require('./config');
var UrlAccessType = require('../lib/UrlAccessType');
var mongoose = require('mongoose');

exports.init = function (app) {

  app.use(cfg.routes.api.root + '/*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Authorization, origin, content-type, accept');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS, HEAD')
    next();
  });

  /**
   * Load <User>resourceOwner along with
   * authenticated user to later determine if
   * one has access to anothers' data
   */
  app.use(cfg.routes.api.versionRoot + '/user/:userId/*', function (req, res, next) {

    if(req.params.userId === UrlAccessType.GUEST){

      req.resourceOwnerType = UrlAccessType.GUEST;
      req.resourceOwner = {};
      next();

    } else if(req.params.userId === UrlAccessType.ADMIN){

      req.resourceOwnerType = UrlAccessType.ADMIN;

      routeAuthenticationService.require('ROLE_ADMIN')(req, res, function(){
        req.resourceOwner = req.user;
        next();
      });

    } else if(req.params.userId === UrlAccessType.ME){

      req.resourceOwnerType = UrlAccessType.ME;
      routeAuthenticationService.require('ROLE_USER')(req, res, function(){
        req.resourceOwner = req.user;
        next();
      });

    } else if (req.params.userId != null){

      req.resourceOwnerType = UrlAccessType.USER;
      routeAuthenticationService.require('ROLE_USER')(req, res, function(){

        mongoose.model('User').findById(req.params.userId, function(userError, userFromPath){
          if (userError) {
            console.error(userError)
            return res.status(403).end();
          }
          req.resourceOwner = userFromPath;
          next();
        });

      });

    } else {
      res.status(404).end();
    }

    return;

  });

  // setup routes for this app
  app.use('/', require('../routes/index'));
  app.use(cfg.routes.auth.path, require('../routes/auth'));
  app.use(cfg.routes.api.versionRoot + '/user/:userId/bucket', require('../routes/bucket'));

  // CATCHING ERRORS BELOW

  // 404 errors
  ////////////////////////////////

  app.use(function (req, res) {

    res.status(404);
    if (req.accepts('html')) {
      res.render('404.html');
      return;
    }
    if (req.accepts('json')) {
      res.send({ error : 'Not found' });
      return;
    }
    res.type('txt').send('Not found');

  });

  // other errors
  ////////////////////////////////

  app.use(function (err, req, res) {

    console.log([
          'ERROR: ' + (err.status || 500),
          'TIME: ' + (new Date()),
          'URL: ' + req.url,
          'QUERY: ' + JSON.stringify(req.query),
          'STACK: ' + err.stack
      ].join('; ')
    );

    res.status(err.status || 500);
    res.render('500.html', {
      status : err.status || 500,
      error : err
    });
  });

};
