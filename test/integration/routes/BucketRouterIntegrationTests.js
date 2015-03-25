var
  request = require('supertest'),
  bodyParser = require('body-parser'),
  rewire = require("rewire"),
  should = require('should'),
  express = require('express'),
  UrlAccessType = require('../../../server/lib/UrlAccessType'),
  EditableRouteMiddleware = require('../../IntegrationTestHelpers').EditableRouteMiddleware,
  app, routerMock
;

describe('bucket router path tests', function () {

  var editable = new EditableRouteMiddleware();

  before(function(){
    app = express();
    app.use(bodyParser.json());
    app.use(editable.editableMiddleware());
    routerMock = rewire('../../../server/routes/bucket');
    routerMock.__set__({
      allowAll:function(req,res,next){ next() },
      allowUser:function(req,res,next){ next() }
    })
    app.use(routerMock);
  });

  after(function(){
  });

  describe('GET /', function () {

    it('returns no items', function (done) {

      editable.withRequestData({resourceOwnerType: UrlAccessType.GUEST}, function (reqDone) {

        var revert = routerMock.__set__({
          bucketService: {
            list: function (searchOpts, positionalOpts, cb) {
              cb(null, [], 0);
            }
          }
        })
        request(app)
          .get('/')
          .expect('Content-Type', /json/)
          .expect(/\"data\".?\:.?\[\]/)
          .expect(/\"total\".?\:.?0/)
          .expect(200, function (err, res) {
            revert();
            reqDone()
            if (err) return done(err);
            done();
          });

      });

    });

    it('returns some items', function (done) {

      editable.withRequestData({resourceOwnerType: UrlAccessType.GUEST}, function (reqDone) {

        var revert = routerMock.__set__({
          bucketService: {
            list: function (searchOpts, positionalOpts, cb) {
              cb(null, [{_id: 3}, {_id: 4}], 44);
            }
          }
        })
        request(app)
          .get('/')
          .expect('Content-Type', /json/)
          .expect(/\"data\".?\:.?\[.*_id.*\]/)
          .expect(/\"total\".?\:.?44/)
          .expect(200, function (err, res) {
            revert();
            reqDone();
            if (err) return done(err);
            done();
          });

      });
    });

    it('returns error', function (done) {

      editable.withRequestData({resourceOwnerType: UrlAccessType.GUEST}, function (reqDone) {

        var revert = routerMock.__set__({
          bucketService: {
            list: function (searchOpts, positionalOpts, cb) {
              cb('arrgh');
            }
          }
        })
        request(app)
          .get('/')
          .expect('Content-Type', /json/)
          .expect(/\"errors\".?\:.?\[.*arrgh.*\]/)
          .expect(400, function (err, res) {
            revert();
            reqDone();
            if (err) return done(err);
            done();
          });

      });
    });

    it('allows anonymous on guest path', function (done) {

      editable.withRequestData({resourceOwnerType: UrlAccessType.GUEST}, function (reqDone) {

        var revert = routerMock.__set__({
          bucketService: {
            list: function (searchOpts, positionalOpts, cb) {
              (searchOpts.user === undefined).should.be.true;
              searchOpts.isPublic.should.be.true;
              cb(null, [{_id: 3}, {_id: 4}], 44);
            }
          }
        })
        request(app)
          .get('/')
          .expect(200, function (err, res) {
            reqDone();
            revert();
            if (err) return done(err);
            done();
          });

      });
    });

    it('forces anonymous to search for public on guest path', function (done) {
      editable.withRequestData({resourceOwnerType: UrlAccessType.GUEST}, function (reqDone) {
      var revert = routerMock.__set__({
        bucketService: {
          list: function (searchOpts, positionalOpts, cb) {
            (searchOpts.user === undefined).should.be.true;
            searchOpts.isPublic.should.be.true;
            cb(null, [{_id: 3}, {_id: 4}], 44);
          }
        }
      })
      var req = request(app);
      req.query = {isPublic: false};
      req.get('/')
        .expect(200, function (err, res) {
          revert();
          reqDone();
          if (err) return done(err);
          done();
        });
      })
    });

    it('rejects anonymous on *me* path', function (done) {
      editable.withRequestData({resourceOwnerType: UrlAccessType.ME}, function (reqDone) {
        request(app).get('/').expect(401, function (err, res) {
          reqDone();
          if (err) return done(err);
          done();
        });
      });
    });

    it('rejects anonymous on *user* path', function (done) {
      editable.withRequestData({resourceOwnerType: UrlAccessType.USER}, function (reqDone) {
        request(app).get('/').expect(401, function (err, res) {
          reqDone();
          if (err) return done(err);
          done();
        });
      });
    });

    it('rejects anonymous on *admin* path', function (done) {
      editable.withRequestData({resourceOwnerType: UrlAccessType.ADMIN}, function (reqDone) {
        request(app).get('/').expect(401, function (err, res) {
          reqDone();
          if (err) return done(err);
          done();
        });
      });
    });

    it('shows public buckets on *user* path when authenticate duser is not owner', function (done) {

      editable.withRequestData({user:{_id:123},resourceOwner:{_id:'x'},resourceOwnerType: UrlAccessType.USER}, function (reqDone) {
        var revert = routerMock.__set__({
          bucketService: {
            list: function (searchOpts, positionalOpts, cb) {
              cb(null, [], 0);
            }
          }
        })
        var req = request(app);
        req.get('/')
          .expect(200, function (err, res) {
            revert();
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

    it('rejects user on *admin* path', function (done) {
      editable.withRequestData({user:{_id:123},resourceOwnerType: UrlAccessType.ADMIN}, function (reqDone) {
        request(app).get('/').expect(401, function (err, res) {
          reqDone();
          if (err) return done(err);
          done();
        });
      });
    });

  });

  describe('GET /:id', function () {

    it('fails with error as no resource owner in request', function (done) {
      var req = request(app);
      req.get('/bla')
        .expect('Content-Type', /json/)
        .expect(/User not found in path/)
        .expect(400, function (err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('fails with error', function (done) {
      editable.withRequestData({resourceOwner:{_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          bucketService: {
            findOne: function (a, b, c) {
              c('myError')
            }
          }
        })
        request(app)
          .get('/bla')
          .expect('Content-Type', /json/)
          .expect(/myError/)
          .expect(400, function (err, res) {
            revert();
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

    it('returns with 404 if no bucket is found', function (done) {
      editable.withRequestData({resourceOwner:{_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          bucketService: {
            findOne: function (a, b, c) {
              c(null, null)
            }
          }
        })
        request(app)
          .get('/bla')
          .expect(404, function (err, res) {
            revert();
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

    it('returns with 403', function (done) {
      editable.withRequestData({resourceOwner:{_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          bucketService: {
            findOne: function (a, b, c) {
              c(null, {isPublic: false})
            }
          }
        })
        var req = request(app);
        req.user = {_id: 'some user id'}
        req.get('/bla')
          .expect(403, function (err, res) {
            revert();
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

    it('returns public bucket', function (done) {
      editable.withRequestData({resourceOwner:{_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          bucketService: {
            findOne: function (a, b, c) {
              c(null, {isPublic: true})
            }
          }
        })
        var req = request(app);
        req.get('/bla')
          .expect(200)
          .expect(/data/, function (err, res) {
            revert();
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

  });


  describe('POST /', function () {

    it('fails without authentication', function (done) {
      request(app)
        .post('/')
        .expect(401, done);
    });

    it('fails with error as resource owner is not set', function (done) {
      editable.withRequestData({user: {_id:123}}, function (reqDone) {
        request(app)
          .post('/')
          .expect(403, function (err, res) {
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

    it('fails on guest path when authenticated as user', function (done) {
      editable.withRequestData({user: {_id:123}, resourceOwnerType: UrlAccessType.GUEST}, function (reqDone) {
        request(app)
          .post('/')
          .expect(404, function (err, res) {
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

    it('fails on guest path when authenticated as admin', function (done) {
      editable.withRequestData({user: {_id:123, isAdmin:true}, resourceOwnerType: UrlAccessType.GUEST}, function (reqDone) {
        request(app)
          .post('/')
          .expect(404, function (err, res) {
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

    it('fails for user when not own path', function (done) {
      editable.withRequestData({user: {_id:123}, resourceOwnerType: UrlAccessType.USER, resourceOwner: {_id:321}}, function (reqDone) {
        request(app)
          .post('/')
          .expect(403, function (err, res) {
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

    it('fails for user when on admin path', function (done) {
      editable.withRequestData({user: {_id:123}, resourceOwnerType: UrlAccessType.ADMIN}, function (reqDone) {
        request(app)
          .post('/')
          .expect(403, function (err, res) {
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

    it('fails with service error', function (done) {

      editable.withRequestData({user: {_id:123}, resourceOwner: {_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          bucketService: {
            createOne: function (a, b) {
              b('error')
            }
          }
        });
        request(app)
          .post('/')
          .expect('Content-Type', /json/)
          .expect(/error/)
          .expect(400, function (err, res) {
            revert();
            reqDone();
            if (err) return done(err);
            done();
          });
      });

    });

    it('returns bucket', function (done) {

      editable.withRequestData({user: {_id:123}, resourceOwner: {_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          bucketService: {
            createOne: function (a, b) {
              b(null,{_id:444})
            }
          }
        });
        request(app)
          .post('/')
          .expect('Content-Type', /json/)
          .expect(/\"data\".?\:.?\{.*_id.*\}/)
          .expect(201, function (err, res) {
            revert();
            reqDone();
            if (err) return done(err);
            done();
          });
      });

    });

    it('check default bucket values added in controller', function (done) {

      editable.withRequestData({user: {_id:123}, resourceOwner: {_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          bucketService: {
            createOne: function (a, b) {

              a.path.should.equal('');
              a.description.should.equal('');
              a.isPublic.should.equal(false);
              a.user.should.equal(123);
              a.data.length.should.equal(0);

              b(null,{_id:444})
            }
          }
        });
        request(app)
          .post('/')
          .expect(201, function (err, res) {
            revert();
            reqDone();
            if (err) return done(err);
            done();
          });
      });

    });

    it('check overriden bucket values', function (done) {

      editable.withRequestData({user: {_id:123}, resourceOwner: {_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          bucketService: {
            createOne: function (a, b) {

              a.path.should.equal('ttl');
              a.description.should.equal('dscr');
              a.isPublic.should.equal(true);
              a.user.should.equal(123);
              a.data.length.should.equal(0);

              b(null,{_id:444})
            }
          }
        });
        request(app)
          .post('/')
          .send({path:'ttl',description:'dscr',isPublic:'true',user:'ss',videos:['tt']})
          .set('Accept', 'application/json')
          .expect(201, function (err, res) {
            revert();
            reqDone();
            if (err) return done(err);
            done();
          });
      });

    });

  });


  describe('PUT /:id', function () {

    it('fails without authentication', function (done) {
      request(app)
        .put('/yay')
        .expect(401, done);
    });

    it('fails with error as resource owner is not set', function (done) {
      editable.withRequestData({user: {_id:123}}, function (reqDone) {
        request(app)
          .put('/yay')
          .expect(403, function (err, res) {
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

    it('fails on guest path when authenticated as user', function (done) {
      editable.withRequestData({user: {_id:123}, resourceOwnerType: UrlAccessType.GUEST}, function (reqDone) {
        request(app)
          .put('/yay')
          .expect(404, function (err, res) {
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

    it('fails on guest path when authenticated as admin', function (done) {
      editable.withRequestData({user: {_id:123, isAdmin:true}, resourceOwnerType: UrlAccessType.GUEST}, function (reqDone) {
        request(app)
          .put('/yay')
          .expect(404, function (err, res) {
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

    it('fails for user when not own path', function (done) {
      editable.withRequestData({user: {_id:123}, resourceOwnerType: UrlAccessType.USER, resourceOwner: {_id:321}}, function (reqDone) {
        request(app)
          .put('/yay')
          .expect(403, function (err, res) {
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

    it('fails for user when on admin path', function (done) {
      editable.withRequestData({user: {_id:123}, resourceOwnerType: UrlAccessType.ADMIN}, function (reqDone) {
        request(app)
          .put('/yay')
          .expect(403, function (err, res) {
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

    it('returns 400 as user has access but error is returned',function(done){
      editable.withRequestData({user: {_id:123}, resourceOwnerType: UrlAccessType.USER, resourceOwner: {_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          bucketService: {
            findOne: function(a,b,c){
              c('arrrgh')
            }
          }
        });
        request(app)
          .put('/yay')
          .send({path:'ttl',description:'dscr',isPublic:'true',user:'ss'})
          .set('Accept', 'application/json')
          .expect(/arrrgh/)
          .expect(400, function (err, res) {
            revert();
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

    it('returns 404 as user has access but bucket is not found',function(done){
      editable.withRequestData({user: {_id:123}, resourceOwnerType: UrlAccessType.USER, resourceOwner: {_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          bucketService: {
            findOne: function(a,b,c){
              c(null,null)
            }
          }
        });
        request(app)
          .put('/yay')
          .send({title:'ttl',description:'dscr',isPublic:'true',user:'ss',videos:['tt']})
          .set('Accept', 'application/json')
          .expect(404, function (err, res) {
            revert();
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

    it('returns 403 as user has access but is not the owner',function(done){
      editable.withRequestData({user: {_id:123}, resourceOwnerType: UrlAccessType.USER, resourceOwner: {_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          bucketService: {
            findOne: function(a,b,c){
              c(null,{user:{_id:765}})
            }
          }
        });
        request(app)
          .put('/yay')
          .send({path:'ttl',description:'dscr',isPublic:'true',user:'ss'})
          .set('Accept', 'application/json')
          .expect(403, function (err, res) {
            revert();
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

    it('returns 400 as update fails',function(done){
      editable.withRequestData({user: {_id:123}, resourceOwnerType: UrlAccessType.USER, resourceOwner: {_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          bucketService: {
            findOne: function(a,b,c){
              c(null,{user:{_id:123}})
            },
            updateOne: function(id,payload,cb){
              id.should.equal('yay');
              payload.path.should.equal('ttl');
              payload.description.should.equal('dscr');
              payload.isPublic.should.equal(true);
              Object.keys(payload).length.should.equal(3);
              cb('arrgh');
            }
          }
        });
        request(app)
          .put('/yay')
          .send({path:'ttl',description:'dscr',isPublic:'true',user:'ss'})
          .set('Accept', 'application/json')
          .expect(/arrgh/)
          .expect(400, function (err, res) {
            revert();
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

    it('returns 200 as update succeeds',function(done){
      editable.withRequestData({user: {_id:123}, resourceOwnerType: UrlAccessType.USER, resourceOwner: {_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          bucketService: {
            findOne: function(a,b,c){
              c(null,{user:{_id:123}})
            },
            updateOne: function(id,payload,cb){
              id.should.equal('yay');
              payload.path.should.equal('ttl');
              payload.description.should.equal('dscr');
              payload.isPublic.should.equal(true);
              Object.keys(payload).length.should.equal(3);
              cb(null,{_id:7777});
            }
          }
        });
        request(app)
          .put('/yay')
          .send({path:'ttl',description:'dscr',isPublic:'true',user:'ss'})
          .set('Accept', 'application/json')
          .expect(/7777/)
          .expect(200, function (err, res) {
            revert();
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

  });


  describe('DELETE /:id', function () {

    it('fails without authentication', function (done) {
      request(app)
        .delete('/yay')
        .expect(401, done);
    });

    it('fails with error as resource owner is not set', function (done) {
      editable.withRequestData({user: {_id:123}}, function (reqDone) {
        request(app)
          .delete('/yay')
          .expect(403, function (err, res) {
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

    it('fails on guest path when authenticated as user', function (done) {
      editable.withRequestData({user: {_id:123}, resourceOwnerType: UrlAccessType.GUEST}, function (reqDone) {
        request(app)
          .delete('/yay')
          .expect(404, function (err, res) {
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

    it('fails on guest path when authenticated as admin', function (done) {
      editable.withRequestData({user: {_id:123, isAdmin:true}, resourceOwnerType: UrlAccessType.GUEST}, function (reqDone) {
        request(app)
          .delete('/yay')
          .expect(404, function (err, res) {
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

    it('fails for user when not own path', function (done) {
      editable.withRequestData({user: {_id:123}, resourceOwnerType: UrlAccessType.USER, resourceOwner: {_id:321}}, function (reqDone) {
        request(app)
          .delete('/yay')
          .expect(403, function (err, res) {
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

    it('fails for user when on admin path', function (done) {
      editable.withRequestData({user: {_id:123}, resourceOwnerType: UrlAccessType.ADMIN}, function (reqDone) {
        request(app)
          .delete('/yay')
          .expect(403, function (err, res) {
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

    it('returns 400 as user has access but error is returned',function(done){
      editable.withRequestData({user: {_id:123}, resourceOwnerType: UrlAccessType.ME, resourceOwner: {_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          bucketService: {
            findOne: function(a,b,c){
              c('arrrgh')
            }
          }
        });
        request(app)
          .delete('/yay')
          .set('Accept', 'application/json')
          .expect(/arrrgh/)
          .expect(400, function (err, res) {
            revert();
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

    it('returns 404 as user has access but bucket is not found',function(done){
      editable.withRequestData({user: {_id:123}, resourceOwnerType: UrlAccessType.ME, resourceOwner: {_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          bucketService: {
            findOne: function(a,b,c){
              c(null,null)
            }
          }
        });
        request(app)
          .delete('/yay')
          .set('Accept', 'application/json')
          .expect(404, function (err, res) {
            revert();
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

    it('returns 403 as user has access but is not the owner',function(done){
      editable.withRequestData({user: {_id:123}, resourceOwnerType: UrlAccessType.ME, resourceOwner: {_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          bucketService: {
            findOne: function(a,b,c){
              c(null,{user:{_id:765}})
            }
          }
        });
        request(app)
          .delete('/yay')
          .set('Accept', 'application/json')
          .expect(403, function (err, res) {
            revert();
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

    it('returns 400 as delete fails',function(done){
      editable.withRequestData({user: {_id:123}, resourceOwnerType: UrlAccessType.ME, resourceOwner: {_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          bucketService: {
            findOne: function(a,b,c){
              c(null,{user:{_id:123}})
            },
            deleteOne: function(id,owner,cb){
              id.should.equal('yay');
              cb('arrgh');
            }
          }
        });
        request(app)
          .delete('/yay')
          .set('Accept', 'application/json')
          .expect(/arrgh/)
          .expect(400, function (err, res) {
            revert();
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

    it('returns 204 as delete succeeds',function(done){
      editable.withRequestData({user: {_id:123}, resourceOwnerType: UrlAccessType.ME, resourceOwner: {_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          bucketService: {
            findOne: function(a,b,c){
              c(null,{user:{_id:123}})
            },
            deleteOne: function(id,owner,cb){
              id.should.equal('yay');
              cb(null);
            }
          }
        });
        request(app)
          .delete('/yay')
          .set('Accept', 'application/json')
          .expect(204, function (err, res) {
            revert();
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

  });

});
