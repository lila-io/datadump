'use strict';

var
	mongoose = require('mongoose'),
  config = require('../conf/config'),
	_ = require('underscore'),
	async = require('async'),
	MODELNAME = 'BucketToken',
  ValidatorError = mongoose.Error.ValidatorError,
  ValidationError = mongoose.Error.ValidationError,
  JWT = require('jsonwebtoken')
;

function generateToken(id){

  var valueToSign = id + '___' + Date.now() + '___' + Math.random();
  if(id == null){
    throw new Error('Illegal arguments, must be: id. ' + Array.prototype.slice.call(arguments));
  }
  return JWT.sign(valueToSign, config.auth.token.secret);
}

exports.findOne = function(token, cb){

  var
    args = Array.prototype.slice.call(arguments),
    query
    ;

  if(token == null || !_.isFunction(cb)){
    throw new Error('Illegal arguments, must be: token, callback: ' + args);
  }

  query = mongoose.model(MODELNAME).findOne({token:token});

  query.exec(function(err,item){
    if(err != null){
      return cb(err);
    }
    cb(null,item);
  });
};

exports.createOne = function(bucketId, cb){

  var
    args = Array.prototype.slice.call(arguments),
    token, props
    ;

  if(bucketId == null || !_.isFunction(cb)){
    throw new Error('Illegal arguments, must be: bucketId, callback: ' + args);
  }

  token = generateToken(bucketId);
  props = {
    bucket: bucketId,
    token: token
  };

  mongoose.model(MODELNAME).create(props,function(err,item){
    if(err != null){
      if(err.name === 'MongoError' && err.code === 11000){
        var newErr = new ValidationError(err);
        newErr.errors.path = new ValidatorError('path', 'Bucket path should be unique', 'user defined', props.path);
        return cb(newErr);
      }
      return cb(err);
    }
    cb(null,item);
  });
};

exports.deleteOne = function(id, cb){

  var
    args = Array.prototype.slice.call(arguments),
    query
    ;

  if(id == null || !_.isFunction(cb)){
    throw new Error('Illegal arguments, must be: id, callback: ' + args);
  }

  query = mongoose.model(MODELNAME).findByIdAndRemove(id);
  query.exec(function (err,deletedItem){
    if(err != null){
      return cb(err);
    }
    cb(null,deletedItem);
  });
};

exports.list = function(bucketId, options, cb){

  /* jshint maxcomplexity:10 */

  var
    args = Array.prototype.slice.call(arguments),
    searchQuery = {bucket:bucketId},
    projection = null,
    sortOption = {},
    positionalParams,
    getItems, getCount, asyncFinally
    ;

  if(args.length === 2) {
    cb = args[1];
    options = null;
  }

  if(bucketId == null || !_.isFunction(cb)){
    throw new Error('Illegal arguments, must be: bucketId, options[optional], callback: ' + args);
  }

  options = options || {};
  options.sort = options.sort || 'dateCreated';
  sortOption[options.sort] = options.order === 'asc' ? 1 : -1;
  positionalParams = { skip: options.offset || 0, limit:options.max || 10, sort: sortOption };

  getItems = function(done) {
    mongoose.model(MODELNAME).find(searchQuery, projection, positionalParams, function(err,results){
      if(err != null){
        return done(err);
      }
      done(null,results);
    });
  };

  getCount = function(done) {
    mongoose.model(MODELNAME).count(searchQuery, function(err,result){
      if(err != null){
        return done(err);
      }
      done(null,result);
    });
  };

  asyncFinally = function(err, results) {
    if (err) {
      return cb(err);
    }
    cb(null,results.items,results.total);
  };

  async.parallel({ items: getItems, total: getCount }, asyncFinally);

};
