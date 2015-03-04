/**
 * bootstrap.js
 *
 * Create new data here required
 * for app startup. Roles,Users,...
 * */

'use strict';

var mongoose = require('mongoose');
var q = require('q');
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
    mongoose.connection.db.dropDatabase();
    return prepareRoles().then(prepareTestUsers);
  }

  return prepareRoles().then(prepareUsers);

  // HELPER METHODS
  //////////////////////////

  function prepareRoles(){
    console.log('creating roles');
    return q.all([
      q.ninvoke(Role, 'findOrCreate', 'ROLE_USER'),
      q.ninvoke(Role, 'findOrCreate', 'ROLE_SUPERADMIN')
    ])
  }

  function prepareUsers(roles){
    console.log('creating users with roles:', roles);
    return q.all([
      createSuperAdminUser(roles)
    ]);
  }

  function prepareTestUsers(roles){
    console.log('creating users with roles:', roles);
    return q.all([
      createSuperAdminUser(roles),
      createTestUsers(roles)
    ]);
  }

  function createSuperAdminUser(roles){
    console.log('setting up superadmin');
    var role = roles[1];
    if('ROLE_SUPERADMIN' !== role.authority){
      throw new Error('Expecting superadmin role')
    }
    var superadmin = { username:'superadmin', password:'CHANGEME', authorities:[role._id], enabled:true };
    switch (environment){
      case 'test':
        superadmin.password = 'superadmin';
        break;
      case 'development':
        superadmin.password = 'superadmin';
        break;
    }
    return q.ninvoke(User, 'findOrCreate', superadmin, true);
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
