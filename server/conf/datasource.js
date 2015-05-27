'use strict';

var cassandra = require('cassandra-driver');
var config = require('./config');
var util = require('../lib/util');
var path = require('path');
var Q = require('q');

/**
 * Cassandra driver wrapper
 * Initiates connection, stores client instance, updates schema
 *
 * @param {*} overrides
 * @constructor
 */
function Cassandra(overrides){

  if( ! this instanceof Cassandra ){
    throw new Error('Must be called with `new` operator');
  }

  overrides = overrides || {};
  var options = util.extend({}, config.db, overrides);

  /**
   * If schema name is set then in test env it is gonna be updated
   * @type {null|*|test_schema}
   */
  this.schemaName = overrides.schemaName || null;
  this.schemaEncoding = 'utf8';

  console.log('Starting db connection to : ', options.contactPoints);

  /**
   * http://docs.datastax.com/en/developer/nodejs-driver/2.0/common/drivers/reference/clientOptions.html
   * @type {{}}
   * @private
   */
  this._clientOptions = {};

  if(options.contactPoints){
    this._clientOptions.contactPoints = options.contactPoints;
  }
  if(options.keyspace != null){
    this._clientOptions.keyspace = options.keyspace;
  }
  if(options.protocol != null){
    this._clientOptions.protocolOptions = this._clientOptions.protocolOptions || {};
    this._clientOptions.protocolOptions.port = options.protocol;
  }

  this._client = null;
  this._initializing = null;

  this._init();
}

/**
 * @private
 */
Cassandra.prototype._init = function(){

  var self = this;
  var deferred = Q.defer();

  if(self._client || self._initializing){
    throw new Error("Connection already present or in progress");
  }

  self._executeSchemaQueries().then(function(){

    self._client = new cassandra.Client( self._clientOptions );
    self._client.on('log', function(level, className, message, furtherInfo) {
      // console.log('log event: %s -- %s', level, message);
    });

    /** optionally connect to Cassandra
     *  although when querying this method is
     *  invoked internally all the time
     */
    self._client.connect(function(err, result) {
      if(err){
        throw new Error('Could not connect to Cassandra', err);
      }
      console.log('[%d] Connected to cassandra',process.pid, 'to keyspace', self._clientOptions.keyspace);

      deferred.resolve();
    });

  });

  self._initializing = deferred.promise;
};

/**
 * @returns {promise}
 */
Cassandra.prototype.getClient = function(){

  var deferred = Q.defer();
  var self = this;

  if(self._client === null){
    self._initializing.then(function(){
      if(!self._client){
        deferred.reject('could not obtain client after initialization');
      } else {
        deferred.resolve(self._client);
      }
    });
  } else {
    deferred.resolve(self._client);
  }

  return deferred.promise;
};

Cassandra.prototype.disconnect = function(cb){
  if(this._client)
    return this._client.shutdown(cb);

  cb();
};

/**
 * Parse schema file and execute queries one by one
 * against connected Cassandra cluster.
 * Shut down afterwards and reinitialize client
 * with test keyspace name, so that queries work.
 * @private
 * returns {promise}
 */
Cassandra.prototype._executeSchemaQueries = function(){

  var self = this;
  var deferred = Q.defer();
  var schemaFile;
  var cass;

  if(self.schemaName){

    schemaFile = path.join( __dirname, '../models/', self.schemaName );

    cass = new cassandra.Client({
      contactPoints: self._clientOptions.contactPoints,
      keyspace: null
    });

    cass.connect(function(err, result) {
      if(err){
        throw new Error('Could not connect to Cassandra', err);
      }
      console.log('[%d] Executing commands from', schemaFile);

      // parse contents
      var text = fs.readFileSync(schemaFile, {encoding: self.schemaEncoding});

      // remove new lines
      var trimmed_text = text.replace(/(\r\n|\n|\r)/gm,"");

      // split queries as does not work when batched
      var queries = trimmed_text.split(';');

      self._executeManyWithClient(queries,cass).then(function(){
        cass.shutdown(function(){
          deferred.resolve();
        });
      }).done();

    });

  } else {
    deferred.resolve();
  }

  return deferred.promise;
};

/**
 * @private
 * returns {promise}
 */
Cassandra.prototype._executeManyWithClient = function(queries, client){

  var tasks = [];

  queries.forEach(function(query,idx){

    if(!query || !query.trim()) return;

    var fn = function(){
      var deferred = Q.defer();
      client.execute( query, null, null, function(err, res){
        if(err){
          deferred.reject(err);
        } else {
          deferred.resolve(res);
        }
      });
      return deferred.promise;
    }

    tasks.push(fn);

  });

  return tasks.reduce(function (soFar, f) {
    return soFar.then(f);
  }, Q(function(){ return true; }));
};

/**
 * Drop all data in keyspace
 * @returns {promise}
 */
Cassandra.prototype.truncateData = function(){

  var self = this;
  var deferred = Q.defer();

  self.getClient().then(function(client){

    var queries = [
      'TRUNCATE users',
      'TRUNCATE user_tokens',
      'TRUNCATE login_attempts',
      'TRUNCATE buckets',
      'TRUNCATE bucket_items'
    ];

    self._executeManyWithClient(queries,client).then(function(){
      deferred.resolve();
    }).done();
  });

  return deferred.promise;
};

/**
 * export singleton
 * @type {Cassandra}
 */
exports = module.exports = new Cassandra();
