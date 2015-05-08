/**
 * bootstrap.js
 *
 * Create new data here required
 * for app startup, e.g. users with roles
 * */

'use strict';

var q = require('q');
var config = require('./config');
var datasource = require('./datasource')
var environment = (process.env.NODE_ENV || 'development');
var UserSchema = require('../models/user');

/* jshint newcap:false */

/**
 * @returns Promise
 */
exports.init = function(app) {

	console.log('Running bootstrap.js in environment', environment);

  var applicationRoles = ['ROLE_USER','ROLE_ADMIN']

  if('test' === environment){
    return prepareTestUsers();
  }

  return prepareUsers();


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

  function createUser(data){
    var deferred = q.defer();
    UserSchema.prepareInsertStatement(data, function(err,statement){
      datasource.getClient().execute(statement.query, statement.values, {prepare: true}, function(err){
        if(err) {
          deferred.reject(err);
        } else {
          deferred.resolve();
        }
      });
    });
    return deferred.promise;
  }

  function createAdminUser(){

    if(config.admin.setupAdmin){
      console.log('setting up admin user');

      return createUser({
        username: config.admin.username,
        password: config.admin.password,
        display_name: 'Administrator',
        is_enabled: true,
        date_created: new Date(),
        authorities: [applicationRoles[1]]
      });
    }

    return;
  }

  function createTestUsers(){
    console.log('setting up test users');
    var role = applicationRoles[0];
    return q.all([
      createUser({
        username: 'user',
        password: 'user',
        display_name: 'User',
        is_enabled: true,
        date_created: new Date(),
        authorities: [applicationRoles[0]]
      }),
      createUser({
        username: 'jane',
        password: 'jane',
        display_name: 'Jane',
        is_enabled: true,
        date_created: new Date(),
        authorities: [applicationRoles[0]]
      }),
      createUser({
        username: 'tom',
        password: 'tom',
        display_name: 'Tom',
        is_enabled: true,
        date_created: new Date(),
        authorities: [applicationRoles[0]]
      }),
      createUser({
        username: 'billy',
        password: 'billy',
        display_name: 'Billy',
        is_enabled: true,
        date_created: new Date(),
        authorities: [applicationRoles[0]]
      })
    ])
  }

};
