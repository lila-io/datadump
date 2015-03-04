var
  should = require('should'),
  request = require('superagent'),
  exec = require('child_process').exec,
  MongoClient = require('mongodb').MongoClient,
  q = require('Q'),
  child
;

function findUser(username){
  var deferred = q.defer();

  console.log('searching for',username)

  MongoClient.connect('mongodb://localhost/test_db', function(err, db) {
    if(err) return deferred.reject(err);
    var user = db.collection('datadump_user');
    var pattern = new RegExp('^'+username+'$');

    console.log('whithin collection',user.collectionName)

    user.find({username:pattern}).toArray(function(err,users){
      console.log('found',users)
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

describe('Bucket API functional tests', function () {

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

  describe('Anonymous access', function () {

    var bucket;
    var user;

    before(function(done){

      console.log("before hook")

      this.timeout(10000);
      findUser('user')
        .then(function(u){
          user = u;
          return saveBucket({
            user:user._id,
            description:'public bucket',
            path:'user-specific-path',
            isPublic: true
          });
        })
        .catch(function (error) {
          console.log("error",error)
        })
        .done(function(b){
          bucket = b;
          done();
        });
    });

    after(function(done){
      // TODO: drop bucket for user u
      done();
    });

    it('shows public bucket on guest path', function(done){
      request
        .get('http://localhost:8080/api/v1/user/guest/bucket/'+bucket._id)
        .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
        .end(function(err, res){
          should.not.exist(err);
          res.status.should.eql(200);
          res.body.data._id.should.eql(bucket._id.toString())
          new Date(res.body.data.dateCreated).toDateString().should.eql(new Date().toDateString())
          res.body.data.description.should.eql(bucket.description)
          res.body.data.isPublic.should.eql(bucket.isPublic)
          res.body.data.path.should.eql(bucket.path)
          res.body.data.user.should.eql(user._id.toString())
          done();
        });
    });
    it('shows public bucket on me path', function(done){
      request
        .get('http://localhost:8080/api/v1/user/me/bucket/'+bucket._id)
        .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
        .end(function(err, res){
          should.not.exist(err);
          res.status.should.eql(200);
          res.body.data._id.should.eql(bucket._id.toString())
          new Date(res.body.data.dateCreated).toDateString().should.eql(new Date().toDateString())
          res.body.data.description.should.eql(bucket.description)
          res.body.data.isPublic.should.eql(bucket.isPublic)
          res.body.data.path.should.eql(bucket.path)
          res.body.data.user.should.eql(user._id.toString())
          done();
        });
    });
    it('shows public bucket on user path', function(done){
      request
        .get('http://localhost:8080/api/v1/user/'+user._id.toString()+'/bucket/'+bucket._id.toString())
        .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
        .end(function(err, res){
          should.not.exist(err);
          res.status.should.eql(200);
          res.body.data._id.should.eql(bucket._id.toString())
          new Date(res.body.data.dateCreated).toDateString().should.eql(new Date().toDateString())
          res.body.data.description.should.eql(bucket.description)
          res.body.data.isPublic.should.eql(bucket.isPublic)
          res.body.data.path.should.eql(bucket.path)
          res.body.data.user.should.eql(user._id.toString())
          done();
        });
    });
    it('shows public bucket on admin path', function(done){
      request
        .get('http://localhost:8080/api/v1/user/admin/bucket/'+bucket._id)
        .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
        .end(function(err, res){
          should.not.exist(err);
          res.status.should.eql(200);
          res.body.data._id.should.eql(bucket._id.toString())
          new Date(res.body.data.dateCreated).toDateString().should.eql(new Date().toDateString())
          res.body.data.description.should.eql(bucket.description)
          res.body.data.isPublic.should.eql(bucket.isPublic)
          res.body.data.path.should.eql(bucket.path)
          res.body.data.user.should.eql(user._id.toString())
          done();
        });
    });

    it('returns 404 for private bucket on guest path', function(done){});
    it('returns 403 for private bucket on me path', function(done){});
    it('returns 403 for private bucket on user path', function(done){});
    it('returns 403 for private bucket on admin path', function(done){});
  });

  describe('Authenticated user access', function () {});
  describe('Admin user access', function () {});

});
