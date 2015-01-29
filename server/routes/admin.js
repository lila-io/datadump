'use strict';

var
  router = require('express').Router(),
  routeAuthenticationService = require('../services/RouteAuthenticationService')
  ;

router.use(routeAuthenticationService.require('ROLE_SUPERADMIN'));

router.get('/', function (req, res) {
  res.send({data:[]});
});

module.exports = router;
