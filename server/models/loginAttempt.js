var
  config = require('../conf/config'),
  BaseModel = require('./baseModel'),
  util = require('util')
  ;

function LoginAttempt(options){
  BaseModel.call(this,options);
}

util.inherits(LoginAttempt, BaseModel);

LoginAttempt.prototype.countByIp = function(ip, callback){
  callback(null,0)
}

LoginAttempt.prototype.countByIpAndUsername = function(ip, username, callback){
  callback(null,0)
}

var LoginAttemptSchema = new LoginAttempt({
  column_family: 'login_attempts',
  columns: {
    ip: {type: 'text'},
    username: {type: 'text'},
    time: {type: 'timestamp'}
  }
});

module.exports = LoginAttemptSchema;
