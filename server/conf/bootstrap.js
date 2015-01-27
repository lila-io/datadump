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
  }

  return createRoles().then(createUsers);

  // HELPER METHODS
  //////////////////////////

  function createRoles(){
    console.log('creating roles');
    return q.all([
      q.ninvoke(Role, 'findOrCreate', 'ROLE_USER'),
      q.ninvoke(Role, 'findOrCreate', 'ROLE_SUPERADMIN')
    ])
  }

  function createUsers(roles){
    console.log('creating users with roles:', roles);
    return q.all([
      createSuperAdminUser(roles)
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
};
