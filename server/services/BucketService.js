'use strict';

var
	_ = require('underscore'),
	async = require('async'),
  models = require('../models')
;

exports.findOne = function(itemId, username, cb){

  var
    args = Array.prototype.slice.call(arguments),
    queryParams = {}
    ;

  if(args.length === 2) {
    cb = args[1];
    username = null;
  }

  if(itemId == null || !_.isFunction(cb)){
    throw new Error('Illegal arguments, must be: itemId, username, callback: ' + args);
  }

  if(username == null){
    queryParams.id = itemId;
  } else {
    queryParams.id = itemId;
    queryParams.username = username;
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

exports.deleteOne = function(id, ownerId, cb){

  var
    args = Array.prototype.slice.call(arguments),
    query
    ;

  if(args.length === 2) {
    cb = args[1];
    ownerId = null;
  }

  if(id == null || !_.isFunction(cb)){
    throw new Error('Illegal arguments, must be: id, (optional)ownerId, callback: ' + args);
  }

  if(ownerId == null){
    query = mongoose.model(MODELNAME).findByIdAndRemove(id);
  } else {
    query = mongoose.model(MODELNAME).findOneAndRemove({_id:id, user:ownerId});
  }

  query.exec(function (err,deletedItem){
    if(err != null){
      return cb(err);
    }
    cb(null,deletedItem);
  });
};

exports.list = function(searchQuery, options, cb){

  /* jshint maxcomplexity:15 */

  var
    args = Array.prototype.slice.call(arguments),
    projection = null,
    sortOption = {},
    query = {},
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

  searchQuery = searchQuery || {};
  if(searchQuery.query){
    query.$or = [];
    query.$or.push( { path: { $regex : '.*' + searchQuery.query + '.*', $options : 'i' } } )
    query.$or.push( { description: { $regex : '.*' + searchQuery.query + '.*', $options : 'i' } } )
  }

  if(searchQuery.isPublic != null){
    query.isPublic = searchQuery.isPublic;
  }

  if(searchQuery.user != null){
    query.user = searchQuery.user;
  }

  getItems = function(done) {
    mongoose.model(MODELNAME).find(query, projection, positionalParams, function(err,results){
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
