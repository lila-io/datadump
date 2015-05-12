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

User.prototype.convertRowToUserObject = function(userRow){
  var usrObj = {};
  userRow.keys().forEach(function(fieldName,index,array){
    usrObj[fieldName] = userRow.get(fieldName);
  })
  if (roleCompareService.rolesHaveAccessFor(usrObj.authorities, 'ROLE_ADMIN')) {
    usrObj.isAdmin = true;
  }
  return usrObj;
};

User.prototype.addRolesForUsername = function(username, roles, callback){
  // TODO: update user roles
  this.findByUsername(username,callback);
}


User.prototype.findByProviderProfileAndUpdate = function(provider,profile,callback){

  var query = ['SELECT * FROM',this.column_family,'WHERE',provider,'CONTAINS',profile.id].join(' ');
  datasource.getClient().execute(query, null, {prepare: false}, function(err, users){

    var filteredUsers = [], self = this;

    if(err) {
      return callback(err);
    }

    if(!users || users.rowLength === 0){
      return callback(null,null);
    }

    // might be more results because of "CONTAINS"
    // be sure to filter out "in case"
    users.forEach(function(userRow,index,array){
      var providerObj = userRow.get(provider);
      if(providerObj.id === profile.id){
        filteredUsers.push( self.convertRowToUserObject(userRow) )
      }
    });

    if(!filteredUsers.length){
      return callback(null,null);
    }

    if(filteredUsers.length > 1){
      var errMsg = ['Too many users found for provider',provider,'id',profile.id].join(' ');
      throw new Error(errMsg);
    }

    var u = filteredUsers[0];
    u[provider] = profile;
    var updateObj = {username: u.username};
    updateObj[provider] = profile;

    self.prepareInsertStatement(updateObj, function(err,statement){
      datasource.getClient().execute(statement.query, statement.values, {prepare: true}, function(err){
        if(err) {
          callback(err);
        } else {
          callback(null, u);
        }
      });
    });
  });
};

User.prototype.insertProviderUser = function(userProfile,callback){
  this.prepareInsertStatement(userProfile, function(err,statement){
    datasource.getClient().execute(statement.query, statement.values, {prepare: true}, function(err){
      if(err) {
        callback(err);
      } else {
        callback();
      }
    });
  });
};

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
      var usrObj = this.convertRowToUserObject(userRow);

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


