'use strict';

var cfg = require('./config');
var RouteUserLoader = require('../services/RouteUserLoaderService');
var RouteErrors = require('../services/RouteErrorsService');

exports.init = function (app) {

  app.use(cfg.routes.api.root + '/*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Authorization, origin, content-type, accept');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS, HEAD');
    next();
  });

  /**
   * Load <User>resourceOwner along with
   * authenticated user to later determine if
   * one has access to anothers' data
   */
  app.use(cfg.routes.api.versionRoot + '/user/:userId/*', RouteUserLoader.load('userId'));

  // setup routes for this app
  app.use('/', require('../routes/index'));
  app.use(cfg.routes.auth.path, require('../routes/auth'));
  app.use(cfg.routes.api.versionRoot + '/user/:userId/bucket/:bucketId/data', require('../routes/bucketItem'));
  app.use(cfg.routes.api.versionRoot + '/user/:userId/bucket', require('../routes/bucket'));

  // 404 errors
  app.use(RouteErrors.sendNotFound());

  // Server errors
  app.use(RouteErrors.catchServerErrors());

};
