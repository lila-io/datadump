var
  config = require('../conf/config'),
  BaseModel = require('./baseModel')
  ;

var BucketSchema = new BaseModel({
  column_family: 'buckets',
  columns: {
    name: {type: 'text'},
    description: {type: 'text'},
    username: {type: 'text'},
    date_created: {type: 'timestamp'},
    is_public: {type: 'boolean'}
  }
});

module.exports = BucketSchema;
