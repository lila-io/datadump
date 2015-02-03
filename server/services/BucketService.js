'use strict';

var
	mongoose = require('mongoose'),
	_ = require('underscore'),
	async = require('async'),
	MODELNAME = 'Bucket'
;

exports.findOne = function(itemId, ownerId, cb){

  if(itemId == null || !_.isFunction(cb)){
    throw new Error('Illegal arguments, must be: itemId, ownerId, callback: ' + Array.prototype.slice.call(arguments));
  }

  var query = {_id:itemId};
  if(ownerId != null){
    query.user = ownerId;
  }
  mongoose.model(MODELNAME).findOne(query, function(err,item){
		if(err != null){
			return cb(err);
		}
    mongoose.model(MODELNAME).populate(item, {path:'data'}, function(errr, preparedItem){
			if(errr != null){
				return cb(errr);
			}
			cb(null,preparedItem);
		});
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
      return cb(err);
    }
    cb(null,item);
  });
};

exports.updateOne = function(id, properties, cb){

	if(id == null || !_.isObject(properties) || 'function' !== typeof cb){
		throw new Error('Illegal arguments, must be: id, object, callback: ' + Array.prototype.slice.call(arguments));
	}

  mongoose.model(MODELNAME).findOneAndUpdate({_id:id}, properties, function(err,item){
		if(err != null){
			return cb(err);
		}
		cb(null,item);
	});

};

exports.deleteOne = function(id, ownerId, cb){

  var args = Array.prototype.slice.call(arguments);
  if(args.length === 2) {
    cb = args[1];
    ownerId = null;
  }

  if(id == null || 'function' !== typeof cb){
    throw new Error('Illegal arguments, must be: id, (optional)ownerId, callback: ' + Array.prototype.slice.call(arguments));
  }

  function callback(err,deletedItem){
    if(err != null){
      return cb(err);
    }
    cb(null,deletedItem);
  }

  if(!ownerId){
    mongoose.model(MODELNAME).findOneAndRemove({_id:id}, callback);
  } else {
    mongoose.model(MODELNAME).findOneAndRemove({_id:id, user:ownerId}, callback);
  }

};

exports.list = function(search, options, cb){
	findItems(search, options, cb);
};


function findItems(searchQuery, options, cb){

	var
		projection = null,
		sortOption = {},
		positionalParams
	;

	options = options || {};
	sortOption[options.sort] = options.order === 'asc' ? 1 : -1;
	positionalParams = { skip: options.offset || 0, limit:options.max || 10, sort: sortOption };

	if('function' !== typeof cb){
		throw new Error('Illegal arguments, must be: searchQuery, options, callback: ' + Array.prototype.slice.call(arguments));
	}

	var getItems = function(done) {

    mongoose.model(MODELNAME).find(searchQuery, projection, positionalParams, function(err,results){
			if(err != null){
				return done(err);
			}

      mongoose.model(MODELNAME).populate(results, {path:'data'}, function(errr, items){
				if(errr != null){
					return done(errr);
				}
				done(null,items);
			});

		});
	};

	var getCount = function(done) {
    mongoose.model(MODELNAME).count(searchQuery, function(err,result){
			if(err != null){
				return done(err);
			}
			done(null,result);
		});
	};

	var asyncFinally = function(err, results) {
		if (err) {
			return cb(err);
		}

		cb(null,results.items,results.total);
	};

	async.parallel({ items: getItems, total: getCount }, asyncFinally);

}
