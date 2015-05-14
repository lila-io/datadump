var datasource = require('../server/conf/datasource');
var config = require('../server/conf/config')
var fs = require('fs');
var path = require('path');
var Q = require('q');
var test_schema = path.join(__dirname,'../server/models','test_schema.txt');

function CassandraHelper(){
  this.schemaPath = test_schema;
  this.schemaPathEncoding = 'utf8';
  this.keyspace = config.db.keyspace;
  this.contactPoints = config.db.contactPoints;
  this._client = null;
  this._initializing = null;
  this._init();
}

/**
 * Asynchronously initialize and store promise
 * @private
 */
CassandraHelper.prototype._init = function(){
  var deferred = Q.defer();
  this.setupTestSchema(function(){
    deferred.resolve();
  });
  this._initializing = deferred.promise;
};

/**
 * Get test client to execute queries against
 * @returns {promise}
 */
CassandraHelper.prototype.getTestClient = function(){
  var self = this;
  var deferred = Q.defer();

  if(self._client){

    deferred.resolve(self._client);

  } else if(self._initializing){

    console.log("checking promise")

    self._initializing.then(function(){

      console.log("promise finished")

      var instance = new datasource.Cassandra({
        contactPoints: self.contactPoints,
        keyspace: self.keyspace
      });

      self._client = instance.getClient();

      deferred.resolve(self._client);

    });

  } else {
    throw new Error('Could not initialize client')
  }

  return deferred.promise;
};

/**
 * Drop all data in all keyspaces
 * @returns {promise}
 */
CassandraHelper.prototype.truncateData = function(){

  var self = this;
  var deferred = Q.defer();

  self.getTestClient().then(function(client){

    var queries = [
      'TRUNCATE users',
      'TRUNCATE user_tokens',
      'TRUNCATE login_attempts',
      'TRUNCATE buckets',
      'TRUNCATE bucket_items'
    ];

    self.executeManyWithClient(queries,client).then(function(){
      deferred.resolve();
    }).done();
  });

  return deferred.promise;
};

/**
 * Parse schema file and execute queries one by one
 * against connected Cassandra cluster.
 * Shut down afterwards and reinitialize client
 * with test keyspace name, so that queries work.
 */
CassandraHelper.prototype.setupTestSchema = function(callback){

  var self = this;

  var cass = new datasource.Cassandra({
    contactPoints: self.contactPoints,
    keyspace: null
  });

  cass.getClient().connect(function(err, result) {
    if(err){
      throw new Error('Could not connect to Cassandra', err);
    }
    console.log('[%d] Connected to test cassandra',process.pid);

    // parse contents
    var text = fs.readFileSync(self.schemaPath, {encoding: self.schemaPathEncoding});

    // remove new lines
    var trimmed_text = text.replace(/(\r\n|\n|\r)/gm,"");

    // split queries as does not work when batched
    var queries = trimmed_text.split(';');

    self.executeManyWithClient(queries,cass.getClient()).then(function(){
      cass.disconnect(callback)
    }).done();

  });
};

/**
 * returns {promise}
 */
CassandraHelper.prototype.executeManyWithClient = function(queries, client){

  var tasks = [];

  queries.forEach(function(query,idx){

    if(!query || !query.trim()) return;

    var fn = function(){
      var deferred = Q.defer();
      console.log("promise started",idx)
      console.log("query",query)
      client.execute( query, null, null, function(err, res){
        console.log("promise finished",idx)
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

module.exports = new CassandraHelper();

exports.CassandraHelper = CassandraHelper;
