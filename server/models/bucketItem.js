var
  config = require('../conf/config'),
  BaseModel = require('./baseModel')
  ;

var BucketItemSchema = new BaseModel({
  column_family: 'bucket_items',
  columns: {
    time_created: {type: 'timeuuid'},
    year_month: {type: 'int'},
    bucket_name: {type: 'text'},
    username: {type: 'text'},
    data: {type: 'map<text, text>'}
  }
});

module.exports = BucketItemSchema;
