var
  config = require('../conf/config'),
  BaseModel = require('./baseModel')
  ;

var BucketItemSchema = new BaseModel({
  column_family: 'bucket_items',
  columns: {
    id: {type: 'timeuuid', primary: true},
    year_month: {type: 'int', primary: true},
    bucket_id: {type: 'timeuuid', primary: true},
    username: {type: 'text', primary: true},
    data: {type: 'map<text, text>'}
  }
});

module.exports = BucketItemSchema;
