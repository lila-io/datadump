'use strict';

var
	mongoose = require('mongoose'),
	_ = require('underscore'),
	async = require('async'),
	MODELNAME = 'Bucket',
  ValidatorError = mongoose.Error.ValidatorError,
  ValidationError = mongoose.Error.ValidationError
;

exports.findOne = function(itemId, ownerId, cb){

  var
    args = Array.prototype.slice.call(arguments),
    query
    ;

  if(args.length === 2) {
    cb = args[1];
    ownerId = null;
  }

  if(itemId == null || !_.isFunction(cb)){
    throw new Error('Illegal arguments, must be: itemId, ownerId, callback: ' + args);
  }

  if(ownerId == null){
    query = mongoose.model(MODELNAME).findById(itemId);
  } else {
    query = mongoose.model(MODELNAME).findOne({_id:itemId, user:ownerId});
  }

  query.exec(function(err,item){
    if(err != null){
      if(err.name === 'CastError')
        return cb(null,null);
      return cb(err);
    }
    cb(null,item);
  });
};

exports.findOneByUserAndPath = function(userId, path, cb){

  var
    args = Array.prototype.slice.call(arguments),
    query
    ;

  if(userId == null || path == null || !_.isFunction(cb)){
    throw new Error('Illegal arguments, must be: userId, path, callback: ' + args);
  }

  query = mongoose.model(MODELNAME).findOne({user:userId,path:path});

  query.exec(function(err,item){
    if(err != null){
      return cb(err);
    }
    cb(null,item);
  });
};

exports.createOne = function(properties, cb){

	var props = {}, defaults = {
    user: null,
    description: '',
    path: '',
    isPublic: false,
    data: []
	};

  if(!_.isObject(properties) || !_.isFunction(cb)){
    throw new Error('Illegal arguments, must be: object, callback: ' + Array.prototype.slice.call(arguments));
  }

	_.extend(props, defaults, properties);

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

exports.updateOne = function(id, ownerId, properties, cb){

  var
    args = Array.prototype.slice.call(arguments)
    ;

  if(args.length === 3) {
    cb = args[2];
    properties = args[1];
    ownerId = null;
  }

	if(id == null || !_.isObject(properties) || !_.isFunction(cb)){
		throw new Error('Illegal arguments, must be: id, ownerId[optional], object, callback: ' + args);
	}

  exports.findOne(id, ownerId, function(err,item){
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
