'use strict';

var
	bcrypt = require('bcrypt'),
	SALT_WORK_FACTOR = 10,
  config = require('../conf/config'),
  BaseModel = require('./baseModel'),
  util = require('util');
;

var UserSchema = new BaseModel({
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

/*
UserSchema.pre('save', function (next) {
  var user = this;

  // only hash the password if it has been modified (or is new)
  if (!user.isModified('password')) {
    return next();
  }

  // generate a salt
  bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
    if (err) {
      return next(err);
    }

    // hash the password using our new salt
    bcrypt.hash(user.password, salt, function (err, hash) {
      if (err) {
        return next(err);
      }

      // override the cleartext password with the hashed one
      user.password = hash;
      next();
    });
  });
});



UserSchema.statics.findOrCreate = function (data, overwritePassword, cb) {

  data = data || {};

  var pattern = new RegExp('^'+data.username+'$');
  var self = this;

  if(data.username == null){
    return cb('username is required');
  }

  if(overwritePassword !== true){
    overwritePassword = false;
  }

  self.find({ username: pattern }, function(e1,users){
    if(e1) return cb(e1);

    if(users && users.length) {
      if(users.length > 1){
        return cb('More than one user found');
      }
      if(overwritePassword){
        users[0].comparePassword(data.password, function(e11, isMatch){
          if(isMatch){
            cb(null,users[0]);
          } else {
            users[0].password = data.password;
            users[0].save(function(e111,updatedUser){
              if(e111) return cb(e111);
              cb(null,updatedUser);
            });
          }
        });
      } else {
        cb(null,users[0]);
      }
    } else {
      self.create(data,function(e12,newUser){
        if(e12) return cb(e12);
        cb(null,newUser);
      });
    }
  });
};
*/


