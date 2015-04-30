'use strict';

var
	mongoose,
	_ = require('underscore'),
	async = require('async'),
	MODELNAME = 'BucketItem'
;

exports.findOne = function(bucket, bucketItemId, cb){

  var
    args = Array.prototype.slice.call(arguments),
    query
    ;

  if(bucket == null || bucket._id == null || bucketItemId == null || !_.isFunction(cb)){
    throw new Error('Illegal arguments, must be: bucket, bucketItemId, callback: ' + args);
  }

  query = mongoose.model(MODELNAME).findOne({_id:bucketItemId, bucket:bucket._id});
  query.exec(function(err,item){
    if(err != null){
      return cb(err);
    }
    cb(null,item);
  });

};

exports.createOne = function(bucket, data, cb){

  var
    args = Array.prototype.slice.call(arguments),
    props = {
      bucket: null,
      data: data
    }
    ;

  if(bucket == null || bucket._id == null || data == null || !_.isFunction(cb)){
    throw new Error('Illegal arguments, must be: bucket, data, callback: ' + args);
  }

  props.bucket = bucket._id;

  mongoose.model(MODELNAME).create(props, function(err,item){
    if(err != null){
      return cb(err);
    }
    cb(null,item);
  });
};

exports.deleteOne = function(bucket, bucketItemId, cb){

  var
    args = Array.prototype.slice.call(arguments),
    query
    ;

  if(bucket == null || bucket._id == null || bucketItemId == null || !_.isFunction(cb)){
    throw new Error('Illegal arguments, must be: bucket, bucketItemId, callback: ' + args);
  }

  query = mongoose.model(MODELNAME).findOneAndRemove({_id:bucketItemId, bucket: bucket._id});

  query.exec(function (err,deletedItem){
    if(err != null){
      return cb(err);
    }
    cb(null,deletedItem);
  });
};

exports.list = function(bucket, searchQuery, positional, cb){

  /* jshint maxcomplexity:10 */

  var
    args = Array.prototype.slice.call(arguments),
    projection = null,
    sortOption = {},
    positionalParams,
    getItems, getCount, asyncFinally
    ;

  if(bucket == null || bucket._id == null || !_.isObject(searchQuery) || !_.isObject(positional) || !_.isFunction(cb)){
    throw new Error('Illegal arguments, must be: bucket, searchQuery, positional, callback: ' + args);
  }

  positional.sort = positional.sort || 'dateCreated';
  sortOption[positional.sort] = positional.order === 'asc' ? 1 : -1;
  positionalParams = { skip: positional.offset || 0, limit:positional.max || 10, sort: sortOption };

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
};
