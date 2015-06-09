var config = require('../conf/config');
var BaseModel = require('./baseModel');
var util = require('util');
var TimeUuid = require('cassandra-driver').types.TimeUuid;
var extend = require('../lib/util').extend;

function Bucket(props){

  if (!(this instanceof Bucket))
    return new Bucket(props);

  BaseModel.call(this, {
    column_family: 'buckets',
    columns: {
      id: {type: 'timeuuid', primary: true},
      username: {type: 'text', primary: true},
      name: {type: 'text'},
      description: {type: 'text'},
      is_public: {type: 'boolean'}
    },
    props: {
      id: TimeUuid.now(),
      name: '',
      description: '',
      username: null,
      is_public: false
    }
  });

  extend(this.props, props);
}
util.inherits(Bucket, BaseModel);

/**
 * Check if we have such instances in DB
 * based on name and username combination
 */
Bucket.prototype.isUnique = function(cb){

  var self = this;
  self.find({ query: { and$: {username: self.props.username, name: self.props.name} } }, function(err, results){
    if(err){
      return cb(err)
    }

    if(results && results.length){
      self.allErrors.errors.push( {error:'name should be unique'} );
      cb(null, false);
    } else {
      cb(null, true);
    }
  });
};

module.exports = Bucket;
