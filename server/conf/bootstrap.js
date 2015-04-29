/**
 * bootstrap.js
 *
 * Create new data here required
 * for app startup. Roles,Users,...
 * */

'use strict';

var datasource = require('./datasource');
var q = require('q');
var config = require('./config')
var environment = (process.env.NODE_ENV || 'development');

/* jshint newcap:false */

/**
 * @returns Promise
 */
exports.init = function () {

	console.log('Running bootstrap.js in environment', environment);

  var applicationRoles = ['ROLE_USER','ROLE_ADMIN']

  if('test' === environment){
    return prepareTestUsers;
  }

  return prepareUsers;


  // HELPER METHODS
  //////////////////////////

  function prepareUsers(){
    return q.all([
      createAdminUser()
    ]);
  }

  function prepareTestUsers(){
    return q.all([
      createAdminUser(),
      createTestUsers()
    ]);
  }

  function createAdminUser(){

    if(config.admin.setupAdmin){
      console.log('setting up admin user');

      var query = 'INSERT INTO users (username, password, authorities, display_name, email, is_enabled, date_created) VALUES (?,?,?,?,?,?,?)';
      var params = [
        config.admin.username,
        config.admin.password,
        [applicationRoles[1]],
        'Administrator',
        null,
        true,
        new Date()
        ];

      datasource.getClient().execute(query, params, {prepare: true}, function(err) {
        if(err){
          throw new Error('Failed to add admin user in bootstrap');
        }
      });
    }

    return;
  }

  function createTestUsers(roles){
    console.log('setting up test users');
    var role = applicationRoles[0];
    return q.all([
      q.ninvoke(User, 'findOrCreate', { username:'user', password:'user', authorities:[role._id], enabled:true }, true),
      q.ninvoke(User, 'findOrCreate', { username:'jane', password:'jane', authorities:[role._id], enabled:true }, true),
      q.ninvoke(User, 'findOrCreate', { username:'tom', password:'tom', authorities:[role._id], enabled:true }, true),
      q.ninvoke(User, 'findOrCreate', { username:'billy', password:'billy', authorities:[role._id], enabled:true }, true)
    ])
  }
};
