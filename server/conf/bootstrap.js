/**
 * bootstrap.js
 *
 * Create new data here required
 * for app startup. Roles,Users,...
 * */

'use strict';

var mongoose = require('mongoose');
var q = require('q');
var config = require('./config')
var environment = (process.env.NODE_ENV || 'development');

/* jshint newcap:false */

/**
 * @returns Promise
 */
exports.init = function () {

	var
    User = mongoose.model('User'),
		Role = mongoose.model('Role')
  ;

	console.log('Running bootstrap.js in environment',environment);

  if('test' === environment){
    return prepareRoles().then(prepareTestUsers);
  }

  return prepareRoles().then(prepareUsers);

  // HELPER METHODS
  //////////////////////////

  function prepareRoles(){
    console.log('creating roles');
    return q.all([
      q.ninvoke(Role, 'findOrCreate', 'ROLE_USER'),
      q.ninvoke(Role, 'findOrCreate', 'ROLE_ADMIN')
    ])
  }

  function prepareUsers(roles){
    console.log('creating users with roles:', roles);
    return q.all([
      createAdminUser(roles)
    ]);
  }

  function prepareTestUsers(roles){
    console.log('creating users with roles:', roles);
    return q.all([
      createAdminUser(roles),
      createTestUsers(roles)
    ]);
  }

  function createAdminUser(roles){

    if(config.admin.setupAdmin){
      console.log('setting up admin user');
      var role = roles[1];
      if('ROLE_ADMIN' !== role.authority){
        throw new Error('Expecting admin role')
      }
      var admin = { username:config.admin.username, password:config.admin.password, authorities:[role._id], enabled:true };
      return q.ninvoke(User, 'findOrCreate', admin, config.admin.overwritePassword);
    }

    return;
  }

  function createTestUsers(roles){
    console.log('setting up test users');
    var role = roles[0];
    if('ROLE_USER' !== role.authority){
      throw new Error('Expecting user role')
    }

    return q.all([
      q.ninvoke(User, 'findOrCreate', { username:'user', password:'user', authorities:[role._id], enabled:true }, true),
      q.ninvoke(User, 'findOrCreate', { username:'jane', password:'jane', authorities:[role._id], enabled:true }, true),
      q.ninvoke(User, 'findOrCreate', { username:'tom', password:'tom', authorities:[role._id], enabled:true }, true),
      q.ninvoke(User, 'findOrCreate', { username:'billy', password:'billy', authorities:[role._id], enabled:true }, true)
    ])
  }
};
