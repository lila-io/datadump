var
  config = require('../conf/config'),
  BaseModel = require('./baseModel')
  ;

var LoginAttemptSchema = new BaseModel({
  column_family: 'login_attempts',
  columns: {
    ip: {type: 'text'},
    username: {type: 'text'},
    time: {type: 'timestamp'}
  }
});

module.exports = LoginAttemptSchema;
