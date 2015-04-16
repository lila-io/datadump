var
  should = require('should'),
  request = require('superagent'),
  helpers = require('../FunctionalTestHelpers')
;

describe('Index functional tests', function () {

  var serverProcess;

  before(function(done){
    this.timeout(4000);
    helpers.startServer(function(process){
      serverProcess = process;
      done();
    });
  });

  after(function(done){
    helpers.stopServer(serverProcess, done);
  });

  describe('Index page', function () {

    it('returns homepage', function (done) {
      request
        .get('http://localhost:8080/')
        .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
        .end(function(err, res){
          should.not.exist(err);
          res.status.should.eql(200);
          done();
        });
    });

  });

  describe('Error pages', function () {

    it('returns 404 page', function (done) {
      request
        .get('http://localhost:8080/404.html')
        .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
        .end(function(err, res){
          should.not.exist(err);
          res.status.should.eql(200);
          res.text.should.containEql('<title>Page Not Found</title>');
          done();
        });
    });

    it('returns 500 page', function (done) {
      request
        .get('http://localhost:8080/500.html')
        .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
        .end(function(err, res){
          should.not.exist(err);
          res.status.should.eql(200);
          res.text.should.containEql('<title>Server error</title>');
          done();
        });
    });

  });

  describe('Easy XDM pages', function () {

    it('returns loading page', function (done) {
      request
        .get('http://localhost:8080/blank.html')
        .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
        .end(function(err, res){
          should.not.exist(err);
          res.status.should.eql(200);
          res.text.should.containEql('<title>Loading authentication</title>');
          done();
        });
    });

    it('returns login page', function (done) {
      request
        .get('http://localhost:8080/login.html')
        .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
        .end(function(err, res){
          should.not.exist(err);
          res.status.should.eql(200);
          res.text.should.containEql('<title>Login</title>');
          done();
        });
    });

    it('returns name transport page', function (done) {
      request
        .get('http://localhost:8080/name.html')
        .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
        .end(function(err, res){
          should.not.exist(err);
          res.status.should.eql(200);
          res.text.should.containEql('<title>Name transport</title>');
          done();
        });
    });

    it('returns success page', function (done) {
      request
        .get('http://localhost:8080/success.html')
        .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
        .end(function(err, res){
          should.not.exist(err);
          res.status.should.eql(200);
          res.text.should.containEql('<title>Authentication success</title>');
          done();
        });
    });

  });

});
