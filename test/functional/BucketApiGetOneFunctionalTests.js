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

  describe('GET one', function () {

    var tmp = {};

    before(function(done){
      this.timeout(5000);

      function setupUserData(username, cache){
        return findUser(username)
          .then(function(u){
            cache[username] = {};
            cache[username].user = u;
            return setupUserBuckets(u);
          }).then(function(buckets){
            cache[username].publicBucket = buckets[0];
            cache[username].privateBucket = buckets[1];
          })
      }

      function setupUserBuckets(user){
        return q.all([
          saveBucket({
            user:user._id,
            description:'public bucket',
            path:'user-specific-public-path',
            isPublic: true
          }),
          saveBucket({
            user:user._id,
            description:'private bucket',
            path:'user-specific-private-path',
            isPublic: false
          })
        ])
      }

      var operations = [];
      ['user', 'jane', 'tom', 'billy', 'superadmin'].forEach(function(username){
        operations.push(setupUserData(username, tmp))
      });

      q.all(operations).then(function(){
        done()
      });
    });

    after(function(done){
      // TODO: drop data ?
      done();
    });

    describe('having anonymous access', function () {

      it('returns public bucket on guest path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/guest/bucket/'+tmp.user.publicBucket._id)
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            should.not.exist(err);
            res.status.should.eql(200);
            res.body.data._id.should.eql(tmp.user.publicBucket._id.toString())
            new Date(res.body.data.dateCreated).toDateString().should.eql(new Date().toDateString())
            res.body.data.description.should.eql(tmp.user.publicBucket.description)
            res.body.data.isPublic.should.eql(tmp.user.publicBucket.isPublic)
            res.body.data.path.should.eql(tmp.user.publicBucket.path)
            res.body.data.user.should.eql(tmp.user.user._id.toString())
            done();
          });
      });
      it('returns 404 on guest path as bucket is not public', function(done){
        request
          .get('http://localhost:8080/api/v1/user/guest/bucket/'+tmp.user.privateBucket._id)
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            should.not.exist(err);
            res.status.should.eql(404);
            done();
          });
      })
      it('returns 401 on me path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/me/bucket/'+tmp.user.publicBucket._id)
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            should.not.exist(err);
            res.status.should.eql(401);
            done();
          });
      });
      it('returns 401 on user path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/'+tmp.user.user._id.toString()+'/bucket/'+tmp.user.publicBucket._id.toString())
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            should.not.exist(err);
            res.status.should.eql(401);
            done();
          });
      });
      it('returns 401 on admin path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/admin/bucket/'+tmp.user.publicBucket._id)
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            should.not.exist(err);
            res.status.should.eql(401);
            done();
          });
      });

    });

    describe('having user access', function () {

      var token;

      before(function(done){
        getUserToken().then(function(t){
          token = t;
          done();
        })
      });

      it('returns public bucket on guest path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/guest/bucket/'+tmp.jane.publicBucket._id)
          .set('Authorization', bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(200);
            res.body.data._id.should.eql(tmp.jane.publicBucket._id.toString())
            done();
          });
      })
      it('returns my public bucket on guest path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/guest/bucket/'+tmp.user.publicBucket._id)
          .set('Authorization', bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(200);
            res.body.data._id.should.eql(tmp.user.publicBucket._id.toString())
            done();
          });
      })
      it('returns 404 on guest path as bucket is not public', function(done){
        request
          .get('http://localhost:8080/api/v1/user/guest/bucket/'+tmp.jane.privateBucket._id)
          .set('Authorization', bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(404);
            done();
          });
      })
      it('returns 404 on guest path as my bucket is not public', function(done){
        request
          .get('http://localhost:8080/api/v1/user/guest/bucket/'+tmp.user.privateBucket._id)
          .set('Authorization', bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(404);
            done();
          });
      })

      it('returns my bucket on me path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/me/bucket/'+tmp.user.privateBucket._id)
          .set('Authorization', bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(200);
            res.body.data._id.should.eql(tmp.user.privateBucket._id.toString())
            done();
          });
      })
      it('returns 404 on me path as bucket does not exist', function(done){
        request
          .get('http://localhost:8080/api/v1/user/me/bucket/'+tmp.jane.privateBucket._id)
          .set('Authorization', bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(404);
            done();
          });
      })

      it('returns my bucket on my id path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/'+tmp.user.user._id.toString()+'/bucket/'+tmp.user.privateBucket._id)
          .set('Authorization', bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(200);
            res.body.data._id.should.eql(tmp.user.privateBucket._id.toString())
            done();
          });
      })
      it('returns 404 on my id path as bucket does not exist', function(done){
        request
          .get('http://localhost:8080/api/v1/user/'+tmp.user.user._id.toString()+'/bucket/'+tmp.jane.privateBucket._id)
          .set('Authorization', bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(404);
            done();
          });
      })
      it('returns 403 on other user id path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/'+tmp.jane.user._id.toString()+'/bucket/'+tmp.jane.privateBucket._id)
          .set('Authorization', bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(403);
            done();
          });
      })

      it('returns 403 on admin path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/admin/bucket/'+tmp.jane.publicBucket._id)
          .set('Authorization', bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(403);
            done();
          });
      })
    });

    describe('having admin access', function () {

      var token;

      before(function(done){
        getAdminToken().then(function(t){
          token = t;
          done();
        })
      });

      it('returns public bucket on guest path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/guest/bucket/'+tmp.jane.publicBucket._id)
          .set('Authorization', bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(200);
            res.body.data._id.should.eql(tmp.jane.publicBucket._id.toString())
            done();
          });
      })
      it('returns my admin public bucket on guest path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/guest/bucket/'+tmp.superadmin.publicBucket._id)
          .set('Authorization', bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(200);
            res.body.data._id.should.eql(tmp.superadmin.publicBucket._id.toString())
            done();
          });
      })
      it('returns 404 on guest path as bucket is not public', function(done){
        request
          .get('http://localhost:8080/api/v1/user/guest/bucket/'+tmp.jane.privateBucket._id)
          .set('Authorization', bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(404);
            done();
          });
      })
      it('returns 404 on guest path as my admin bucket is not public', function(done){
        request
          .get('http://localhost:8080/api/v1/user/guest/bucket/'+tmp.superadmin.privateBucket._id)
          .set('Authorization', bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(404);
            done();
          });
      })

      it('returns my admin bucket on me path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/me/bucket/'+tmp.superadmin.privateBucket._id)
          .set('Authorization', bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(200);
            res.body.data._id.should.eql(tmp.superadmin.privateBucket._id.toString())
            done();
          });
      })
      it('returns 404 on me path as bucket does not exist', function(done){
        request
          .get('http://localhost:8080/api/v1/user/me/bucket/any')
          .set('Authorization', bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(404);
            done();
          });
      })
      it('returns 404 on me path as bucket does not belong to admin', function(done){
        request
          .get('http://localhost:8080/api/v1/user/me/bucket/'+tmp.jane.privateBucket._id)
          .set('Authorization', bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(404);
            done();
          });
      })

      it('returns my admin bucket on my id path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/'+tmp.superadmin.user._id+'/bucket/'+tmp.superadmin.privateBucket._id)
          .set('Authorization', bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(200);
            res.body.data._id.should.eql(tmp.superadmin.privateBucket._id.toString());
            done();
          });
      })
      it('returns other bucket on my id path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/'+tmp.superadmin.user._id+'/bucket/'+tmp.jane.privateBucket._id)
          .set('Authorization', bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(200);
            res.body.data._id.should.eql(tmp.jane.privateBucket._id.toString());
            done();
          });
      })
      it('returns 404 on my id path as bucket does not exist', function(done){
        request
          .get('http://localhost:8080/api/v1/user/'+tmp.superadmin.user._id+'/bucket/any')
          .set('Authorization', bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(404);
            done();
          });
      })

      it('returns my admin bucket on admin path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/admin/bucket/'+tmp.superadmin.privateBucket._id)
          .set('Authorization', bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(200);
            res.body.data._id.should.eql(tmp.superadmin.privateBucket._id.toString());
            done();
          });
      })
      it('returns public bucket on admin path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/admin/bucket/'+tmp.jane.publicBucket._id)
          .set('Authorization', bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(200);
            res.body.data._id.should.eql(tmp.jane.publicBucket._id.toString());
            done();
          });
      })
      it('returns private bucket on admin path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/admin/bucket/'+tmp.jane.privateBucket._id)
          .set('Authorization', bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(200);
            res.body.data._id.should.eql(tmp.jane.privateBucket._id.toString());
            done();
          });
      })
      it('returns 404 on admin path as bucket does not exist', function(done){
        request
          .get('http://localhost:8080/api/v1/user/admin/bucket/any')
          .set('Authorization', bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(404);
            done();
          });
      })
    });
  })

});
