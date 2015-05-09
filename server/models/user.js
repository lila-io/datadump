'use strict';

var
  config = require('../conf/config'),
  datasource = require('../conf/datasource'),
  BaseModel = require('./baseModel'),
  util = require('util'),
  roleCompareService = require('../services/RoleCompareService')
;

function User(options){
  BaseModel.call(this,options);
}
util.inherits(User, BaseModel);

User.prototype.findByUsername = function(username, callback){

  this.prepareSelectStatement({username:username},function(err,statement){
    datasource.getClient().execute(statement, null, {prepare: true}, function(err, users){

      if(err) {
        return callback(err);
      }

      if(!users || users.rowLength > 1 || !users.first()){
        return callback(null,null);
      }

      var userRow = users.first();

      var usrObj = {};
      userRow.keys().forEach(function(fieldName,index,array){
        usrObj[fieldName] = userRow.get(fieldName);
      })

      if (roleCompareService.rolesHaveAccessFor(usrObj.authorities, 'ROLE_ADMIN')) {
        usrObj.isAdmin = true;
      }

      callback(null, usrObj);

    });
  });

};

var UserSchema = new User({
  column_family: 'users',
  columns: {
    username: {type: 'text'},
    password: {type: 'text', hashed: true},
    display_name: {type: 'text'},
    email: {type: 'text'},
    is_enabled: {type: 'boolean'},
    date_created: {type: 'timestamp'},
    last_login: {type: 'timestamp'},
    authorities: {type: 'list<text>'},
    twitter: {type: 'map<text, text>'},
    facebook: {type: 'map<text, text>'},
    github: {type: 'map<text, text>'},
    google: {type: 'map<text, text>'}
  }
});

module.exports = UserSchema;


