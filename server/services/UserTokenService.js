'use strict';

var
  models = require('../models'),
  tokenService = require('./TokenService')
;

exports.createUserToken = function(username, cb){

  if(!username){
    throw new Error('Username is required');
  }

  if('function' !== typeof cb){
    throw new Error('Callback is required for tokenGenerator');
  }

  tokenService.generateToken(username, function(generatedToken){
    models.userToken.saveTokenForUsername(username, generatedToken, function(err){
      if(err) {
        return cb(err);
      }
      cb(null,generatedToken);
    });
  });
};

exports.deleteUserTokens = function(username, cb){
  if(!username){
    throw new Error('User id is required');
  }

  if('function' !== typeof cb){
    throw new Error('Callback is required for tokenGenerator')
  }

  // TODO: fix delete tokens
  //UserToken.remove({username:username}, function(err){
  //  if(err) {
  //    cb(err);
  //  } else {
  //    cb(null);
  //  }
  //});
};


