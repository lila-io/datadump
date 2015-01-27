'use strict';

var router = require('express').Router();

router.get('/', function (req, res) {
	res.render('index');
});

router.get('/token.html', function (req, res) {
  res.status(404).end();
});

module.exports = router;
