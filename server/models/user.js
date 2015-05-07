'use strict';

var
  config = require('../conf/config'),
  BaseModel = require('./baseModel')
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


