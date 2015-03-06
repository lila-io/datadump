var
  should = require('should'),
  request = require('superagent'),
  q = require('Q'),
  helpers = require('../helpers')
;

describe('Bucket API', function () {

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

  describe('GET one', function () {

    var tmp = {};

    before(function(done){
      this.timeout(5000);
      helpers.prepareBuckets(tmp).then(function(){ done() })
    });

    after(function(done){
      helpers.dropBuckets(tmp).then(function(){ done() })
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
        helpers.getUserToken().then(function(t){
          token = t;
          done();
        })
      });

      it('returns public bucket on guest path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/guest/bucket/'+tmp.jane.publicBucket._id)
          .set('Authorization', helpers.bearerFromToken(token))
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
          .set('Authorization', helpers.bearerFromToken(token))
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
          .set('Authorization', helpers.bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(404);
            done();
          });
      })
      it('returns 404 on guest path as my bucket is not public', function(done){
        request
          .get('http://localhost:8080/api/v1/user/guest/bucket/'+tmp.user.privateBucket._id)
          .set('Authorization', helpers.bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(404);
            done();
          });
      })

      it('returns my bucket on me path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/me/bucket/'+tmp.user.privateBucket._id)
          .set('Authorization', helpers.bearerFromToken(token))
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
          .set('Authorization', helpers.bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(404);
            done();
          });
      })

      it('returns my bucket on my id path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/'+tmp.user.user._id.toString()+'/bucket/'+tmp.user.privateBucket._id)
          .set('Authorization', helpers.bearerFromToken(token))
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
          .set('Authorization', helpers.bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(404);
            done();
          });
      })
      it('returns 403 on other user id path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/'+tmp.jane.user._id.toString()+'/bucket/'+tmp.jane.privateBucket._id)
          .set('Authorization', helpers.bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(403);
            done();
          });
      })

      it('returns 403 on admin path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/admin/bucket/'+tmp.jane.publicBucket._id)
          .set('Authorization', helpers.bearerFromToken(token))
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
        helpers.getAdminToken().then(function(t){
          token = t;
          done();
        })
      });

      it('returns public bucket on guest path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/guest/bucket/'+tmp.jane.publicBucket._id)
          .set('Authorization', helpers.bearerFromToken(token))
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
          .set('Authorization', helpers.bearerFromToken(token))
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
          .set('Authorization', helpers.bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(404);
            done();
          });
      })
      it('returns 404 on guest path as my admin bucket is not public', function(done){
        request
          .get('http://localhost:8080/api/v1/user/guest/bucket/'+tmp.superadmin.privateBucket._id)
          .set('Authorization', helpers.bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(404);
            done();
          });
      })

      it('returns my admin bucket on me path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/me/bucket/'+tmp.superadmin.privateBucket._id)
          .set('Authorization', helpers.bearerFromToken(token))
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
          .set('Authorization', helpers.bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(404);
            done();
          });
      })
      it('returns 404 on me path as bucket does not belong to admin', function(done){
        request
          .get('http://localhost:8080/api/v1/user/me/bucket/'+tmp.jane.privateBucket._id)
          .set('Authorization', helpers.bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(404);
            done();
          });
      })

      it('returns my admin bucket on my id path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/'+tmp.superadmin.user._id+'/bucket/'+tmp.superadmin.privateBucket._id)
          .set('Authorization', helpers.bearerFromToken(token))
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
          .set('Authorization', helpers.bearerFromToken(token))
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
          .set('Authorization', helpers.bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(404);
            done();
          });
      })

      it('returns my admin bucket on admin path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/admin/bucket/'+tmp.superadmin.privateBucket._id)
          .set('Authorization', helpers.bearerFromToken(token))
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
          .set('Authorization', helpers.bearerFromToken(token))
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
          .set('Authorization', helpers.bearerFromToken(token))
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
          .set('Authorization', helpers.bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(404);
            done();
          });
      })
    });
  })

});
