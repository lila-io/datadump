'use strict';

var
	mongoose = require('mongoose'),
	_ = require('underscore'),
	async = require('async'),
	MODELNAME = 'BucketItem',
  bucketService = require('./BucketService')
;

exports.findOneById = function(itemId, cb){

  var
    args = Array.prototype.slice.call(arguments),
    query
    ;

  if(itemId == null || !_.isFunction(cb)){
    throw new Error('Illegal arguments, must be: itemId, callback: ' + args);
  }

  query = mongoose.model(MODELNAME).findById(itemId);
  query.exec(function(err,item){
    if(err != null){
      return cb(err);
    }
    cb(null,item);
  });

};

exports.findOne = function(itemId, userId, bucketPath, cb){

  var
    args = Array.prototype.slice.call(arguments),
    query
    ;

  if(itemId == null || !_.isFunction(cb)){
    throw new Error('Illegal arguments, must be: itemId, userId(optional), bucketPath(optional), callback: ' + args);
  }

  if(userId == null || bucketPath == null){
    return cb(null,null);
  }

  bucketService.findOneByUserAndPath( userId, bucketPath, function(err,bucket){

    if (err != null) {
      return cb(err);
    }

    if (!bucket) {
      return cb(null,null);
    }

    query = mongoose.model(MODELNAME).findOne({_id:itemId, bucket:bucket._id});
    query.exec(function(err,item){
      if(err != null){
        return cb(err);
      }
      cb(null,item);
    });
  });

};

exports.createOne = function(userId, bucketPath, data, cb){

  var
    args = Array.prototype.slice.call(arguments),
    props = {
      bucket: null,
      data: data
	  }
    ;

  if(userId == null || bucketPath == null || data == null || !_.isFunction(cb)){
    throw new Error('Illegal arguments, must be: userId, bucketPath, data, callback: ' + args);
  }

  bucketService.findOneByUserAndPath( userId, bucketPath, function(err, bucket) {
    if (err != null) {
      return cb(err);
    }
    if (!bucket) {
      return cb(null, null);
    }

    props.bucket = bucket._id;

    mongoose.model(MODELNAME).create(props,function(err,item){
      if(err != null){
        return cb(err);
      }
      cb(null,item);
    });
  });
};

exports.deleteOne = function(itemId, userId, bucketPath, cb){

  var
    args = Array.prototype.slice.call(arguments),
    query
    ;

  if(itemId == null || userId == null || bucketPath == null || !_.isFunction(cb)){
    throw new Error('Illegal arguments, must be: itemId, userId, bucketPath, callback: ' + args);
  }

  bucketService.findOneByUserAndPath( userId, bucketPath, function(err,bucket) {

    if (err != null) {
      return cb(err);
    }

    if (!bucket) {
      return cb(null, null);
    }

    query = mongoose.model(MODELNAME).findOneAndRemove({_id:itemId, bucket: bucket._id});

    query.exec(function (err,deletedItem){
      if(err != null){
        return cb(err);
      }
      cb(null,deletedItem);
    });
  });
};

exports.list = function(userId, bucketPath, searchQuery, options, cb){

  /* jshint maxcomplexity:10 */

  var
    args = Array.prototype.slice.call(arguments),
    projection = null,
    sortOption = {},
    positionalParams,
    getItems, getCount, asyncFinally
    ;

  if(userId == null || bucketPath == null || !_.isObject(searchQuery) || !_.isObject(options) || !_.isFunction(cb)){
    throw new Error('Illegal arguments, must be: userId, bucketPath, searchQuery, positional, callback: ' + args);
  }

  options.sort = options.sort || 'dateCreated';
  sortOption[options.sort] = options.order === 'asc' ? 1 : -1;
  positionalParams = { skip: options.offset || 0, limit:options.max || 10, sort: sortOption };

  bucketService.findOneByUserAndPath( userId, bucketPath, function(err, bucket){
    if (err != null) {
      return cb(err);
    }
    if (!bucket) {
      return cb(null,[],0);
    }

    searchQuery.bucket = bucket._id;

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
  });
};
