/**
 * datasource.js
 *
 * Database config goes here
 * */

'use strict';

var mongoose = require('mongoose');
var config = require('./config')
var q = require('q');

/**
 *
 * @param obj
 * @returns {q.promise}
 */
exports.init = function (ctx) {

  var deferred = q.defer();
  var db;
  var dbConfig = { dbUri: config.db.uri, dbOptions: {} };

  if(config.db.username){
    dbConfig.dbOptions.user = config.db.username;
  }
  if(config.db.password){
    dbConfig.dbOptions.pass = config.db.password;
  }

  console.log('Starting db connection to : ', dbConfig.dbUri);

  mongoose.connection.on('open', function () {
    console.log('[%d] Connected to mongo server.',process.pid);
    db = mongoose.connection.db;
    try {
      ctx.mongooseInstance = db;
    } catch(e){}

    if('test' === process.env.NODE_ENV){
      db.dropDatabase();
    }

    deferred.resolve(db);
  });

  mongoose.connection.on('error', function (err) {
    deferred.reject(err);
  });

  mongoose.connect(dbConfig.dbUri, dbConfig.dbOptions);

  return deferred.promise;
};

exports.testDbString = function(){
  return config.db.uri + '_' + Math.floor((Math.random() * 1000000) + 1);
};

exports.disconnect = function(fn){
  console.log('[%d] disconnecting from mongoose',process.pid);
  mongoose.disconnect(fn);
};
