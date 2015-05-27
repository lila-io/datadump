'use strict';

var cfg = require('./config');
var RouteUserLoader = require('../services/RouteUserLoaderService');
var RouteErrors = require('../services/RouteErrorsService');

exports.init = function (app) {

  /**
   * CORS for api routes
   */
  app.use(cfg.routes.api.root + '/*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Authorization, origin, content-type, accept');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS, HEAD');
    next();
  });

  /**
   * Load {User}resourceOwner along with
   * authenticated user to later determine if
   * one has access to others' data
   */
  app.use(cfg.routes.api.versionRoot + '/user/:userId/*', RouteUserLoader.load('userId'));

  /**
   * Define all routes, register routers
   */
  app.use('/', require('../routes/index'));
  app.use(cfg.routes.auth.path, require('../routes/auth'));
  app.use(cfg.routes.api.versionRoot + '/user/:userId/bucket/:bucketId/data', require('../routes/bucketItem'));
  app.use(cfg.routes.api.versionRoot + '/user/:userId/bucket', require('../routes/bucket'));
  app.use(cfg.routes.api.versionRoot + '/user/:userId/admin', require('../routes/admin'));

  /**
   * 404 errors, unhandled routes
   */
  app.use(RouteErrors.sendNotFound());

  /**
   * Catch errors and respond with status 500
   */
  app.use(RouteErrors.catchServerErrors());

};
