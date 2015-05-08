'use strict';

var cassandra = require('cassandra-driver');
var config = require('./config');

function Cassandra(){

  console.log('Starting db connection to : ', config.db.contactPoints);

  // http://docs.datastax.com/en/developer/nodejs-driver/2.0/common/drivers/reference/clientOptions.html
  this._clientOptions = {

    /** Array of addresses or host names of the nodes to add as contact point. */
    // contactPoints: [],

    // keyspace:'',

    /** Contains loadBalancing, retry, reconnection */
    // policies: {},

    /** Default query options */
    //queryOptions: {},

    /** Contains heartbeatInterval, coreConnectionsPerHost */
    //pooling: {},

    /** Contains port, maxSchemaAgreementWaitSeconds */
    //protocolOptions: {},

    /** Contains connectTimeout, keepAlive, keepAliveDelay */
    //socketOptions: {},

    /** Provider to be used to authenticate to an auth-enabled host. Default: null. */
    //authProvider: null,

    /** Client-to-node ssl options: when set the driver will use the secure layer.
     * You can specify cert, ca, ... options named after the Node.js tls.connect options.
     */
    //sslOptions: {},

    /** Contains map, set */
    //encoding: {}

  };

  if(config.db.contactPoints){
    this._clientOptions.contactPoints = config.db.contactPoints;
  }

  if(config.db.keyspace != null){
    this._clientOptions.keyspace = config.db.keyspace;
  }

  if(config.db.protocol != null){
    this._clientOptions.protocolOptions = this._clientOptions.protocolOptions || {};
    this._clientOptions.protocolOptions.port = config.db.protocol;
  }

  this._client = null;

  this.init();
}


Cassandra.prototype.init = function(){

  if(this._client){
    throw new Error("Connection already present");
  }

  this._client = new cassandra.Client( this._clientOptions );
  this._client.on('log', function(level, className, message, furtherInfo) {
    console.log('log event: %s -- %s', level, message);
  });
  /** optionally connect to Cassandra
   *  although when querying this method is
   *  invoked internally all the time
   */
  this._client.connect(function(err, result) {
    if(err){
      throw new Error('Could not connect to Cassandra', err);
    }
    console.log('[%d] Connected to cassandra',process.pid);
  });

};

Cassandra.prototype.getClient = function(){
  if(!this._client){
    return this.init()._client;
  }
  return this._client;
};

Cassandra.prototype.disconnect = function(cb){
  if(this._client)
    return this._client.shutdown(cb);

  cb();
};

exports.Cassandra = Cassandra;

exports = module.exports = new Cassandra();
