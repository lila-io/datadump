var
  should = require('should'),
  request = require('superagent'),
  q = require('q'),
  helpers = require('../FunctionalTestHelpers')
;

describe('Authentication functional tests', function () {

  var serverProcess;

  before(function(done){
    this.timeout(4000);
    helpers.startServer(function(child){
      serverProcess = child;
      done();
    });
  });

  after(function(done){
    helpers.stopServer(serverProcess, function(){
      done();
    });
  });

  describe('Admin login', function () {

    it('fails with 400 as no data sent', function (done) {

      request
        .post('http://localhost:8080/api/auth/login')
        .send({})
        .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
        .end(function(err,res){
          res.text.should.containEql('username and password are required');
          res.status.should.eql(400);
          done();
        });

    });

    it('fails with 400 as username/password is blank', function (done) {

      request
        .post('http://localhost:8080/api/auth/login')
        .send({ username: '', password: '' })
        .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
        .end(function(err,res){
          res.text.should.containEql('username and password are required');
          res.status.should.eql(400);
          done();
        });

    });

    it('fails with 400 as username/password is invalid', function (done) {

      request
        .post('http://localhost:8080/api/auth/login')
        .send({ username: 'ho', password: 'hey' })
        .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
        .end(function(err,res){
          res.text.should.containEql('Username and password combination not found');
          res.status.should.eql(400);
          done();
        });

    });

    it('locks out the user after 7 attempts', function (done) {

      this.timeout(4000);

      function invalidLogin(status,msg){
        'use strict';
        var deferred = q.defer();
        request
          .post('http://localhost:8080/api/auth/login')
          .send({ username: 'ho', password: 'hey' })
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err,res){
            res.text.should.containEql(msg);
            res.status.should.eql(status);
            deferred.resolve();
          });
        return deferred.promise;
      }

      helpers.cleanupRestrictions()
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'reached the maximum number of login attempts')})
        .then(function(){ return invalidLogin(400, 'reached the maximum number of login attempts')})
        .then(function(){ return helpers.cleanupRestrictions() })
        .done(function(){ done() });
    });

    it('locks out the ip address after 50 attempts', function (done) {

      this.timeout(4000);

      function invalidLogin(status,msg){
        'use strict';
        var deferred = q.defer();
        var username = 'invalid_' + Math.floor(Math.random() * 1000);
        request
          .post('http://localhost:8080/api/auth/login')
          .send({ username: username, password: 123456789 })
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err,res){
            res.text.should.containEql(msg);
            res.status.should.eql(status);
            deferred.resolve();
          });
        return deferred.promise;
      }

      helpers.cleanupRestrictions()
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})

        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})

        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})

        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})

        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})
        .then(function(){ return invalidLogin(400, 'Username and password combination not found')})

        .then(function(){ return invalidLogin(400, 'reached the maximum number of login attempts')})
        .then(function(){ return invalidLogin(400, 'reached the maximum number of login attempts')})
        .then(function(){ return helpers.cleanupRestrictions() })
        .done(function(){ done() });
    });

    it('authentication succeeds and returns valid auth token', function (done) {

      function getToken(){
        'use strict';
        var deferred = q.defer();
        request
          .post('http://localhost:8080/api/auth/login')
          .send({ username: 'admin', password: '123456' })
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err,res){
            should.exist(res.body.token);
            res.status.should.eql(200);
            deferred.resolve(res.body.token);
          });
        return deferred.promise;
      }

      function useToken(token){
        'use strict';
        var deferred = q.defer();
        var authHeaderValue = 'Bearer ' + token;
        request
          .get('http://localhost:8080/api/v1/user/me/admin')
          .set('Authorization', authHeaderValue)
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err,res){
            res.status.should.eql(200);
            deferred.resolve();
          });
        return deferred.promise;
      }

      getToken()
        .then(function(t){ return useToken(t) })
        .done(function(){ done() });
    });

  });

});
