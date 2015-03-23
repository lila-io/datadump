var
  should = require('should'),
  request = require('superagent'),
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

  describe('GET list', function () {

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
     it('returns public buckets on guest path', function(done){
       request
         .get('http://localhost:8080/api/v1/user/guest/bucket')
         .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
         .end(function(err, res){
           res.status.should.eql(200);
           res.body.data.length.should.eql(5);
           res.body.total.should.eql(5);
           res.body.data.forEach(function(bucket){
             bucket.isPublic.should.eql(true)
           })
           done();
         });
     });

      it('returns 401 on me path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/me/bucket')
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(401);
            done();
          });
      });
      it('returns 401 on user path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/'+tmp.user.user._id.toString()+'/bucket')
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(401);
            done();
          });
      });
      it('returns 401 on admin path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/admin/bucket')
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
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

      it('returns public buckets on guest path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/guest/bucket')
          .set('Authorization', helpers.bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(200);
            res.body.data.length.should.eql(5);
            res.body.total.should.eql(5);
            res.body.data.forEach(function(bucket){
              bucket.isPublic.should.eql(true)
            })
            done();
          });
      });
      it('returns my buckets on me path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/me/bucket')
          .set('Authorization', helpers.bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(200);
            res.body.data.length.should.eql(2);
            res.body.total.should.eql(2);
            res.body.data.forEach(function(bucket){
              bucket.user.should.eql(tmp.user.user._id.toString())
            })
            done();
          });
      });
      it('returns my buckets on my user path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/'+tmp.user.user._id.toString()+'/bucket')
          .set('Authorization', helpers.bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(200);
            res.body.data.length.should.eql(2);
            res.body.total.should.eql(2);
            res.body.data.forEach(function(bucket){
              bucket.user.should.eql(tmp.user.user._id.toString())
            })
            done();
          });
      });
      it('returns users public buckets on other user path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/'+tmp.jane.user._id.toString()+'/bucket')
          .set('Authorization', helpers.bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(200);
            res.body.data.length.should.eql(1);
            res.body.total.should.eql(1);
            res.body.data.forEach(function(bucket){
              bucket.isPublic.should.eql(true)
              bucket.user.should.eql(tmp.jane.user._id.toString())
            })
            done();
          });
      });
      it('returns 403 on admin path', function(done){
        request
          .get('http://localhost:8080/api/v1/user/admin/bucket')
          .set('Authorization', helpers.bearerFromToken(token))
          .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
          .end(function(err, res){
            res.status.should.eql(403);
            done();
          });
      });
    });


    /*
    describe('having admin access', function () {
      it('returns public buckets on guest path', function(done){});
      it('returns admin buckets on me path', function(done){});
      it('returns any user buckets on user path', function(done){});
      it('returns all buckets on admin path', function(done){});
    });
    */

  });

});
