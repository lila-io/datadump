/**
 * datasource.js
 *
 * Database config goes here
 * */

'use strict';

var mongoose = require('mongoose');
var environment = (process.env.NODE_ENV || 'development');
var q = require('q');

/**
 *
 * @param obj
 * @returns {q.promise}
 */
exports.init = function (ctx) {

  var
    deferred = q.defer(),
    db,
    dbConfig = { dbUri: '', dbOptions: {} }
    ;

  switch (environment) {
    case 'test':
      dbConfig.dbUri = 'mongodb://localhost/test_db'
      break;
    case 'production':
      dbConfig.dbUri = 'mongodb://localhost/prod_db'
      break;
    default:
      dbConfig.dbUri = 'mongodb://localhost/dev_db'
  }

  console.log('Starting db connection to : ', dbConfig.dbUri);

  mongoose.connection.on('open', function () {
    console.log('Connected to mongo server.');
    db = mongoose.connection.db;
    try {
      ctx.mongooseInstance = db;
    } catch(e){}
    deferred.resolve(db);
  });

  mongoose.connection.on('error', function (err) {
    deferred.reject(err);
  });

  mongoose.connect(dbConfig.dbUri, dbConfig.dbOptions);

  return deferred.promise;
};

exports.testDbString = function(){
  return 'mongodb://localhost/test_db_' + Math.floor((Math.random() * 1000000) + 1);
};
