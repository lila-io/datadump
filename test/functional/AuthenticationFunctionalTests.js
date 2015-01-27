var
  should = require('should'),
  request = require('superagent'),
  exec = require('child_process').exec,
  child
;

describe('Authentication functional tests', function () {

  before(function(done){
    this.timeout(4000);
    child = exec('node ./server.js', {env:{NODE_ENV:'test'}},function (error, stdout, stderr) {});

    child.stdout.on('data', function(data) {
      //console.log('stdout: ' + data);

      if( /Listening on port 8080/.test(data) ){
        done()
      }

    });
    child.stderr.on('data', function(data) {
      //console.error('stdout: ' + data);
    });
    child.on('close', function(code) {
      //console.log('closing code: ' + code);
    });
    child.on('exit', function(code) {
      //console.log('exiting code: ' + code);
    });
  });

  after(function(done){
    child.kill();
    done()
  });

  describe('Superadmin login', function () {

    it('fails with 400 as no data sent', function (done) {

      request
        .post('http://localhost:8080/api/auth/login')
        .send({})
        .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
        .end(function(err, res){
          should.not.exist(err);
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
        .end(function(err, res){
          should.not.exist(err);
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
        .end(function(err, res){
          should.not.exist(err);
          res.text.should.containEql('Username and password combination not found');
          res.status.should.eql(400);
          done();
        });

    });

    it('authentication succeeds and returns auth token', function (done) {

      request
        .post('http://localhost:8080/api/auth/login')
        .send({ username: 'superadmin', password: 'superadmin' })
        .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
        .end(function(err, res){
          should.not.exist(err);
          should.exist(res.body.token);
          res.status.should.eql(200);
          done();
        });

    });

  });

});
