'use strict';

/* jshint unused:false */

var
	router = require('express').Router(),
	routeAuthenticationService = require('../services/RouteAuthenticationService')
	;

var allowAdmin = routeAuthenticationService.require('ROLE_ADMIN');
var authAllowAdmin = function(req,res,next){
  allowAdmin.call(this,req,res,next)
}

router.use(authAllowAdmin);

router.get('/', function (req, res) {
  res.status(200).end();
});

module.exports = router;
