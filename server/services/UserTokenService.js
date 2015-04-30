'use strict';

var
  mongoose,
  UserToken,// = mongoose.model('UserToken'),
  tokenService = require('./TokenService')
;

exports.createUserToken = function(userId, cb){

  var data = {
    userId: userId
  };

  if(!userId){
    throw new Error('User id is required');
  }

  if('function' !== typeof cb){
    throw new Error('Callback is required for tokenGenerator');
  }

  tokenService.generateToken(userId, function(generatedToken){
    data.token = generatedToken;
    UserToken.create( data, function(err, tokenEntity){
      if(err) {
        return cb(err);
      }
      cb(null,tokenEntity.token);
    });
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
  });
};


