'use strict';

var
  config = require('../conf/config'),
  BaseModel = require('./baseModel')
;

var UserTokenSchema = new BaseModel({
  column_family: 'user_tokens',
  columns: {
    access_token: {type: 'text'},
    username: {type: 'text'},
    time: {type: 'timestamp'}
  }
});

module.exports = UserTokenSchema;


