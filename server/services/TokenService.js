'use strict';

var
  config = require('../conf/config'),
  JWT = require('jsonwebtoken'),
  crypto = require('crypto')
;

exports.generateToken = function(id,cb){

  if(id == null || 'function' !== typeof cb){
    throw new Error('Illegal arguments, must be: id, fn.' + Array.prototype.slice.call(arguments));
  }

  exports.generateUniqueNumber(function(uniqueNumber){
    var valueToSign = id + '___' + uniqueNumber;
    cb( JWT.sign(valueToSign, config.auth.token.secret) );
  });
};

exports.generateUniqueNumber = function(cb){

  if('function' !== typeof cb){
    throw new Error('Callback is required');
  }

  crypto.randomBytes(48, function(ex, buf) {
    cb( buf.toString('hex') );
  });
};

