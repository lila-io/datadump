'use strict';

var
  config = require('../conf/config'),
  mongoose = require('mongoose'),
  UserToken = mongoose.model('UserToken'),
  JWT = require('jsonwebtoken')
;

exports.generateToken = function(userId, cb){

  if(!userId){
    throw new Error('User id is required');
  }

  if('function' !== typeof cb){
    throw new Error('Callback is required for tokenGenerator')
  }

  var data = {userId:userId}
  var valueToSign = userId + '___' + Date.now();
  data.token = JWT.sign(valueToSign, config.auth.token.secret);

  UserToken.create( data, function(err, tokenEntity){
    if(err) {
      throw err;
    }
    return cb(null,tokenEntity.token);
  });

};

exports.deleteUserTokens = function(userId, cb){
  if(!userId){
    throw new Error('User id is required');
  }

  if('function' !== typeof cb){
    throw new Error('Callback is required for tokenGenerator')
  }

  UserToken.remove({userId:userId}, function(err){
    if(err) {
      cb(err);
    } else {
      cb(null);
    }
  })
};


