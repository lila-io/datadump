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

exports.createOne = function(bucketId, data, cb){

  var
    args = Array.prototype.slice.call(arguments),
    props = {
      bucket: bucketId,
      data: data
	  }
    ;

  if(bucketId == null || data == null || !_.isFunction(cb)){
    throw new Error('Illegal arguments, must be: object, callback: ' + args);
  }

  mongoose.model(MODELNAME).create(props,function(err,item){
    if(err != null){
      return cb(err);
    }
    cb(null,item);
  });
};

exports.updateOne = function(itemId, userId, bucketPath, properties, cb){

  var
    args = Array.prototype.slice.call(arguments)
    ;

  if(itemId == null || properties == null || !_.isFunction(cb)){
    throw new Error('Illegal arguments, must be: itemId, userId, bucketPath, properties, callback: ' + args);
  }

  exports.findOne(itemId, userId, bucketPath, function(err,item){
    if(err != null){
      return cb(err);
    }
    if(item == null){
      return cb(new Error('Document not found'));
    }
    item.set(properties);
    item.save(function(err,item){
      if(err != null){
        return cb(err);
      }
      cb(null,item);
    });
  });
};

exports.deleteOne = function(id, bucketId, cb){

  var
    args = Array.prototype.slice.call(arguments),
    query
    ;

  if(args.length === 2) {
    cb = args[1];
    bucketId = null;
  }

  if(id == null || !_.isFunction(cb)){
    throw new Error('Illegal arguments, must be: id, (optional)bucketId, callback: ' + args);
  }

  if(bucketId == null){
    query = mongoose.model(MODELNAME).findByIdAndRemove(id);
  } else {
    query = mongoose.model(MODELNAME).findOneAndRemove({_id:id, bucket:bucketId});
  }

  query.exec(function (err,deletedItem){
    if(err != null){
      return cb(err);
    }
    cb(null,deletedItem);
  });
};

exports.list = function(searchQuery, options, cb){

  /* jshint maxcomplexity:10 */

  var
    args = Array.prototype.slice.call(arguments),
    projection = null,
    sortOption = {},
    positionalParams,
    getItems, getCount, asyncFinally
    ;

  if(args.length === 2) {
    cb = args[1];
    options = null;
  }

  if(!_.isObject(searchQuery) || !_.isFunction(cb)){
    throw new Error('Illegal arguments, must be: searchQuery, options[optional], callback: ' + args);
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
