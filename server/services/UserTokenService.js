'use strict';

var
  models = require('../models'),
  tokenService = require('./TokenService')
;

exports.createUserToken = function(username, cb){

  var data = {
    username: username
  };

  if(!username){
    throw new Error('Username is required');
  }

  if('function' !== typeof cb){
    throw new Error('Callback is required for tokenGenerator');
  }

  tokenService.generateToken(username, function(generatedToken){
    data.token = generatedToken;

    models.userToken.prepareInsertStatement(data,function(err,statement){

    });

    UserToken.create( data, function(err, tokenEntity){
      if(err) {
        return cb(err);
      }
      cb(null,tokenEntity.token);
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

  UserToken.remove({username:username}, function(err){
    if(err) {
      cb(err);
    } else {
      cb(null);
    }
  });
};


