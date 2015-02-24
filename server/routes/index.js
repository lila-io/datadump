'use strict';

var router = require('express').Router();

router.get('/', function (req, res) {
	res.render('index');
});

// security via obscurity
router.get([
  '/blank.html',
  '/login.html',
  '/name.html',
  '/success.html'], function (req, res) {
  res.status(404).end();
});

module.exports = router;
