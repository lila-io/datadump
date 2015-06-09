'use strict';

var
	_ = require('underscore'),
	async = require('async'),
  models = require('../models')
;

exports.findOne = function(itemId, username, cb){

  var
    args = Array.prototype.slice.call(arguments),
    queryParams = { query: {and$: {}} }
    ;

  if(args.length === 2) {
    cb = args[1];
    username = null;
  }

  if(itemId == null || !_.isFunction(cb)){
    throw new Error('Illegal arguments, must be: itemId, username, callback: ' + args);
  }

  if(username == null){
    queryParams.query.and$.id = itemId;
  } else {
    queryParams.query.and$.id = itemId;
    queryParams.query.and$.username = username;
  }

  models.bucket().find(queryParams, function(err, results){
    if(err){
      return cb(err)
    }

    if(!results || !results.length){
      return cb(null,null);
    }

    cb(null, results[0]);
  });
};

exports.createOne = function(properties, cb){

  var bucket;

  if(!_.isObject(properties) || !_.isFunction(cb)){
    throw new Error('Illegal arguments, must be: object, callback: ' + Array.prototype.slice.call(arguments));
  }

  bucket = new models.bucket(properties);

  if(!bucket.validate()){
    return cb(bucket.errors());
  }

  bucket.isUnique(function(err,isUnique){
    if(err){
      return cb(err);
    }
    if(!isUnique){
      return cb(bucket.errors());
    }

    bucket.save(function(err,res){
      if(err != null){
        return cb(err)
      }
      cb(null,res);
    });
  });

};

exports.updateOne = function(id, username, properties, cb){

  var
    args = Array.prototype.slice.call(arguments),
    where = {id:id, username:username}
    ;

	if(id == null || username == null || !_.isObject(properties) || !_.isFunction(cb)){
		throw new Error('Illegal arguments, must be: id, username, object, callback: ' + args);
	}

  models.bucket().update(where,properties,function(err,res){
    if(err != null){
      return cb(err)
    }
    cb(null,res);
  })
};

/**
 * Delete user bucket, here id and username is required
 * as username is a partition key in DB
 * @param id
 * @param username
 * @param cb
 */
exports.deleteOne = function(id, username, cb){

  var args = Array.prototype.slice.call(arguments);

  if(id == null || username == null || !_.isFunction(cb)){
    throw new Error('Illegal arguments, must be: id, username, callback: ' + args);
  }

  models.bucket().delete({username:username, id:id}, function(err, results){
    if(err){
      return cb(err)
    }

    cb(null, results);
  });
};

exports.list = function(searchObj, positionalObj, cb){

  /* jshint maxcomplexity:15 */

  var
    args = Array.prototype.slice.call(arguments),
    query = {
      and$: {}
    }
  ;

  if(args.length === 2) {
    cb = args[1];
    positionalObj = null;
  }

  if(!_.isObject(searchObj) || !_.isFunction(cb)){
    throw new Error('Illegal arguments, must be: searchObj, positionalObj[optional], callback: ' + args);
  }

  searchObj = searchObj || {};

  if(searchObj.username != null){
    query.and$.username = searchObj.username;
  }

  if(searchObj.id != null){
    query.and$.id = searchObj.id;
  }

  if(searchObj.name != null){
    query.and$.name = searchObj.name;
  }

  if(searchObj.is_public != null){
    query.and$.is_public = searchObj.is_public;
  }

  models.bucket().find({
    query: query,
    positional: positionalObj
  }, function(err, results, total){
    if(err){
      return cb(err)
    }
    if(!results || !results.length){
      return cb(null, [], 0);
    }
    cb(null, results, total);
  });
};
