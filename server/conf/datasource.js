'use strict';

var cassandra = require('cassandra-driver');
var config = require('./config')
var q = require('q');

function Datasource(){

  console.log('Starting db connection to : ', config.db.contactPoints);

  // http://docs.datastax.com/en/developer/nodejs-driver/2.0/common/drivers/reference/clientOptions.html
  this._clientOptions = {

    /** Array of addresses or host names of the nodes to add as contact point. */
    contactPoints: config.db.contactPoints,

    keyspace: config.db.keyspace,

    /** Contains loadBalancing, retry, reconnection */
    // policies: {},

    /** Default query options */
    //queryOptions: {},

    /** Contains heartbeatInterval, coreConnectionsPerHost */
    //pooling: {},

    /** Contains port, maxSchemaAgreementWaitSeconds */
    //protocolOptions: {},

    protocolOptions: { "port": config.db.protocol }

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

  this._client = null;

  this.init();
}


Datasource.prototype.init = function(){
  this._client = new cassandra.Client( this._clientOptions );
  this._client.on('log', function(level, className, message, furtherInfo) {
    console.log('log event: %s -- %s', level, message);
  });
  // optionally connect to datasource
  // although when querying this method is
  // invoked internally all the time
  this._client.connect(function(err, result) {
    if(err){
      throw new Error('Could not connect to datasource', err);
    }
    console.log('[%d] Connected to cassandra',process.pid);
  });


};

Datasource.prototype.getClient = function(){
  return this._client;
};

Datasource.prototype.disconnect = function(cb){
  return this._client.shutdown(cb);
};

/**
 * Export default singleton.
 *
 * @api public
 */
exports = module.exports = new Datasource();
