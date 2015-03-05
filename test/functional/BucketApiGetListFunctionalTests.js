var
  should = require('should'),
  request = require('superagent'),
  exec = require('child_process').exec,
  MongoClient = require('mongodb').MongoClient,
  q = require('Q'),
  child
;

function bearerFromToken(t){
  return 'Bearer ' + t;
}

function findUser(username){
  var deferred = q.defer();

  MongoClient.connect('mongodb://localhost/test_db', function(err, db) {
    if(err) return deferred.reject(err);
    var user = db.collection('datadump_user');
    var pattern = new RegExp('^'+username+'$');

    user.find({username:pattern}).toArray(function(err,users){
      if(users && users.length > 1)
        deferred.reject('Too many users found');
      else if(users && users.length == 1)
        deferred.resolve(users[0]);
      else
        deferred.resolve(null);
    })
  });
  return deferred.promise;
}

function saveBucket(data){
  var deferred = q.defer();
  MongoClient.connect('mongodb://localhost/test_db', function(err, db) {
    if(err) return deferred.reject(err);
    var bucket = db.collection('datadump_bucket');
    bucket.save(data,function(err,doc){
      if(err)
        deferred.reject(err);
      else
        deferred.resolve(doc);
    })
  });
  return deferred.promise;
}

describe('Bucket API', function () {

  before(function(done){
    this.timeout(4000);
    child = exec('node ./server.js', {env:{NODE_ENV:'test'}},function (error, stdout, stderr) {});
    child.stdout.on('data', function(data) {
      if( /Listening on port 8080/.test(data) ){
        done();
      } else {
        //console.log(">>>> data: ",data)
      }
    });
    setTimeout(function(){
      if(child) child.kill();
    },60000);
  });

  after(function(done){
    child.kill();
    done();
  });

  function getUserToken(){
    'use strict';
    var deferred = q.defer();
    request
      .post('http://localhost:8080/api/auth/login')
      .send({ username: 'user', password: 'user' })
      .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
      .end(function(err, res){
        should.not.exist(err);
        should.exist(res.body.token);
        res.status.should.eql(200);
        deferred.resolve(res.body.token);
      });
    return deferred.promise;
  }

  function getAdminToken(){
    'use strict';
    var deferred = q.defer();
    request
      .post('http://localhost:8080/api/auth/login')
      .send({ username: 'superadmin', password: 'superadmin' })
      .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
      .end(function(err, res){
        should.not.exist(err);
        should.exist(res.body.token);
        res.status.should.eql(200);
        deferred.resolve(res.body.token);
      });
    return deferred.promise;
  }


  /*
  describe('GET list', function () {

    describe('having anonymous access', function () {
      it('returns public buckets on guest path', function(done){});
      it('returns 401 on me path', function(done){});
      it('returns 401 on user path', function(done){});
      it('returns 401 on admin path', function(done){});
    });

    describe('having user access', function () {
      it('returns public buckets on guest path', function(done){});
      it('returns my buckets on me path', function(done){});
      it('returns my buckets on my user path', function(done){});
      it('returns 403 on not my user path', function(done){});
      it('returns 403 on admin path', function(done){});
    });

    describe('having admin access', function () {
      it('returns public buckets on guest path', function(done){});
      it('returns admin buckets on me path', function(done){});
      it('returns any user buckets on user path', function(done){});
      it('returns all buckets on admin path', function(done){});
    });

  });

  */

});
