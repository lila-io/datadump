var config = require('../conf/config');
var datasource = require('../conf/datasource');
var BaseModel = require('./baseModel');
var util = require('util');

function Bucket(props){

  if (!(this instanceof Bucket))
    return new Bucket(props);

  BaseModel.call(this, {
    column_family: 'buckets',
    columns: {
      name: {type: 'text', required: true},
      description: {type: 'text'},
      username: {type: 'text', required: true},
      date_created: {type: 'timestamp', required: true},
      is_public: {type: 'boolean'}
    },
    props: props
  });
}
util.inherits(Bucket, BaseModel);

/**
 * Check if we have such instances in DB
 * based on name and username combination
 */
Bucket.prototype.isUnique = function(cb){

  var self = this;
  self.find({ name: self.props.name, username: self.props.username }, function(err, results){
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
