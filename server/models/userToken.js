'use strict';

var
  config = require('../conf/config'),
  datasource = require('../conf/datasource'),
  BaseModel = require('./baseModel'),
  util = require('util')
;

function UserToken(options){
  BaseModel.call(this,options);
}
util.inherits(UserToken, BaseModel);

UserToken.prototype.saveTokenForUsername = function(username, token, callback){
  this.prepareInsertStatement({access_token:token, username:username, time:(new Date())}, function(err,statement){
    datasource.getClient().execute(statement.query, statement.values, {prepare: true}, function(err){
      if(err) {
        callback(err);
      } else {
        callback();
      }
    });
  });
};

var UserTokenSchema = new UserToken({
  column_family: 'user_tokens',
  columns: {
    access_token: {type: 'text'},
    username: {type: 'text'},
    time: {type: 'timestamp'}
  }
});

module.exports = UserTokenSchema;


