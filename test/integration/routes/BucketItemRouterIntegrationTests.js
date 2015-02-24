var
  request = require('supertest'),
  bodyParser = require('body-parser'),
  rewire = require("rewire"),
  should = require('should'),
  express = require('express'),
  UrlAccessType = require('../../../server/lib/UrlAccessType'),
  app, routerMock, customMiddleware
;

/**
 * as route authentication function cannot be overriden as it is already registered
 * the only simple way to mock it out is to mock out passport module
 * which will be called from route authentication method
 * to do it I need to override module cache
 */
function withMocks() {
  var args, closure, moduleNames, moduleCache = [], mocks = [];

  args = Array.prototype.slice.call(arguments);
  if(args.length < 2){
    throw new Error('Missing arguments, should be: moduleName1 [,moduleName2 [,...]], closureBody')
  }
  closure = args[args.length-1];
  if('function' !== typeof closure){
    throw new Error('Last argument must be function in which context modules will be mocked')
  }
  moduleNames = args.slice(0,-1);
  moduleNames.forEach(function(name){
    var n,mod,mock;
    n = name + '';
    mod = require(n);
    mock = rewire(n);
    require.cache[require.resolve(n)] = mock;
    moduleCache.push(mod);
    mocks.push(mock);
  });

  function revert(){
    moduleNames.forEach(function(name,index){
      var n = name + '';
      delete require.cache[require.resolve(n)];
      moduleCache.shift();
      mocks.shift();
    });
  }

  mocks.push(revert);

  closure.apply(closure, mocks);
}

function withRequestData(data, closure) {
  customMiddleware = function (req, res, next) {
    Object.keys(data).forEach(function (key) {
      req[key] = data[key];
    });
    next();
  }

  function revert() {
    customMiddleware = null;
  }

  closure.call(closure, revert);
}
function middleModifier(req, res, next) {
  if (typeof customMiddleware === 'function') {
    customMiddleware.call(this, req, res, next)
  } else {
    next()
  }
}

describe('bucket router path tests', function () {

  before(function(){
    app = express();
    app.use(bodyParser.json());
    app.use(middleModifier);
    routerMock = rewire('../../../server/routes/bucketItem');
    routerMock.__set__({
      allowAll:function(req,res,next){ next() },
      allowUser:function(req,res,next){ next() }
    })
    app.use(routerMock);
  });

  after(function(){
  });

  describe('GET /', function () {
    it('returns 404', function (done) {
      withRequestData({resourceOwnerType: UrlAccessType.GUEST}, function (reqDone) {
        request(app)
          .get('/')
          .expect('Content-Type', /json/)
          .expect(404, function (err, res) {
            reqDone()
            if (err) return done(err);
            done();
          });
      });
    });
  });

  describe('GET /bucketPath', function () {

    it('returns no items', function (done) {

      withRequestData({resourceOwnerType: UrlAccessType.GUEST}, function (reqDone) {

        var revert = routerMock.__set__({
          bucketItemService: {
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

      withRequestData({resourceOwnerType: UrlAccessType.GUEST}, function (reqDone) {

        var revert = routerMock.__set__({
          bucketItemService: {
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

      withRequestData({resourceOwnerType: UrlAccessType.GUEST}, function (reqDone) {

        var revert = routerMock.__set__({
          bucketItemService: {
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

      withRequestData({resourceOwnerType: UrlAccessType.GUEST}, function (reqDone) {

        var revert = routerMock.__set__({
          bucketItemService: {
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
      withRequestData({resourceOwnerType: UrlAccessType.GUEST}, function (reqDone) {
      var revert = routerMock.__set__({
        bucketItemService: {
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
      withRequestData({resourceOwnerType: UrlAccessType.ME}, function (reqDone) {
        request(app).get('/').expect(401, function (err, res) {
          reqDone();
          if (err) return done(err);
          done();
        });
      });
    });

    it('rejects anonymous on *user* path', function (done) {
      withRequestData({resourceOwnerType: UrlAccessType.USER}, function (reqDone) {
        request(app).get('/').expect(401, function (err, res) {
          reqDone();
          if (err) return done(err);
          done();
        });
      });
    });

    it('rejects anonymous on *admin* path', function (done) {
      withRequestData({resourceOwnerType: UrlAccessType.ADMIN}, function (reqDone) {
        request(app).get('/').expect(401, function (err, res) {
          reqDone();
          if (err) return done(err);
          done();
        });
      });
    });

    it('rejects user on *user* path when requesting not own data', function (done) {
      withRequestData({user:{_id:123},resourceOwner:{_id:'x'},resourceOwnerType: UrlAccessType.USER}, function (reqDone) {
        request(app).get('/').expect(401, function (err, res) {
          reqDone();
          if (err) return done(err);
          done();
        });
      });
    });

    it('rejects user on *admin* path', function (done) {
      withRequestData({user:{_id:123},resourceOwnerType: UrlAccessType.ADMIN}, function (reqDone) {
        request(app).get('/').expect(401, function (err, res) {
          reqDone();
          if (err) return done(err);
          done();
        });
      });
    });

  });

  describe('GET /bucketPath/:id', function () {

    it('fails with error', function (done) {
      var revert = routerMock.__set__({
        bucketItemService: {
          findOne: function (a, b, c) {
            c('error')
          }
        }
      })
      request(app)
        .get('/bla')
        .expect('Content-Type', /json/)
        .expect(/error/)
        .expect(400, function (err, res) {
          revert();
          if (err) return done(err);
          done();
        });
    });

    it('returns with 404 if no bucket is found', function (done) {
      var revert = routerMock.__set__({
        bucketItemService: {
          findOne: function (a, b, c) {
            c(null, null)
          }
        }
      })
      request(app)
        .get('/bla')
        .expect(404, function (err, res) {
          revert();
          if (err) return done(err);
          done();
        });
    });

    it('returns with 403', function (done) {
      var revert = routerMock.__set__({
        bucketItemService: {
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
          if (err) return done(err);
          done();
        });
    });

    it('returns public bucket', function (done) {
      var revert = routerMock.__set__({
        bucketItemService: {
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
          if (err) return done(err);
          done();
        });
    });

  });


  describe('POST /bucketPath/', function () {

    it('fails with error', function (done) {

      withRequestData({user: {_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          bucketItemService: {
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

      withRequestData({user: {_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          bucketItemService: {
            createOne: function (a, b) {
              b(null,{_id:444})
            }
          }
        });
        request(app)
          .post('/')
          .expect('Content-Type', /json/)
          .expect(/\"data\".?\:.?\{.*_id.*\}/)
          .expect(200, function (err, res) {
            revert();
            reqDone();
            if (err) return done(err);
            done();
          });
      });

    });

    it('check default bucket values', function (done) {

      withRequestData({user: {_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          bucketItemService: {
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
          .expect(200, function (err, res) {
            revert();
            reqDone();
            if (err) return done(err);
            done();
          });
      });

    });

    it('check overriden bucket values', function (done) {

      withRequestData({user: {_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          bucketItemService: {
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
          .expect(200, function (err, res) {
            revert();
            reqDone();
            if (err) return done(err);
            done();
          });
      });

    });

  });


  describe('PUT /bucketPath/:id', function () {

    it('returns 403 as user does not have right to access resource',function(done){
      withRequestData({user: {_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          ras : {
            canAccessModifyResourcePath: function() {
              return false;
            }
          }
        });
        request(app)
          .put('/yay')
          .send({title:'ttl',description:'dscr',isPublic:'true',user:'ss',videos:['tt']})
          .set('Accept', 'application/json')
          .expect(403, function (err, res) {
            revert();
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

    it('returns 400 as user has access but error is returned',function(done){
      withRequestData({user: {_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          ras : {
            canAccessModifyResourcePath : function() { return true; },
            resourceOwnerId: function(){return 123;}
          },
          bucketItemService: {
            findOne: function(a,b,c){
              c('arrrgh')
            }
          }
        });
        request(app)
          .put('/yay')
          .send({title:'ttl',description:'dscr',isPublic:'true',user:'ss',videos:['tt']})
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
      withRequestData({user: {_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          ras : {
            canAccessModifyResourcePath : function() { return true; },
            resourceOwnerId: function(){return 123;}
          },
          bucketItemService: {
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
      withRequestData({user: {_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          ras : {
            canAccessModifyResourcePath : function() { return true; },
            resourceOwnerId: function(){return 123;},
            canModifyResource: function(){ return false; }
          },
          bucketItemService: {
            findOne: function(a,b,c){
              c(null,{user:{_id:765}})
            }
          }
        });
        request(app)
          .put('/yay')
          .send({title:'ttl',description:'dscr',isPublic:'true',user:'ss',videos:['tt']})
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
      withRequestData({user: {_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          ras : {
            canAccessModifyResourcePath : function() { return true; },
            resourceOwnerId: function(){return 123;},
            canModifyResource: function(){ return true; }
          },
          bucketItemService: {
            findOne: function(a,b,c){
              c(null,{user:{_id:123}})
            },
            updateOne: function(id,payload,cb){
              id.should.equal('yay');
              payload.title.should.equal('ttl');
              payload.description.should.equal('dscr');
              payload.isPublic.should.equal(true);
              Object.keys(payload).length.should.equal(3);
              cb('arrgh');
            }
          }
        });
        request(app)
          .put('/yay')
          .send({title:'ttl',description:'dscr',isPublic:'true',user:'ss',videos:['tt']})
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
      withRequestData({user: {_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          ras : {
            canAccessModifyResourcePath : function() { return true; },
            resourceOwnerId: function(){return 123;},
            canModifyResource: function(){ return true; }
          },
          bucketItemService: {
            findOne: function(a,b,c){
              c(null,{user:{_id:123}})
            },
            updateOne: function(id,payload,cb){
              id.should.equal('yay');
              payload.title.should.equal('ttl');
              payload.description.should.equal('dscr');
              payload.isPublic.should.equal(true);
              Object.keys(payload).length.should.equal(3);
              cb(null,{_id:7777});
            }
          }
        });
        request(app)
          .put('/yay')
          .send({title:'ttl',description:'dscr',isPublic:'true',user:'ss',videos:['tt']})
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


  describe('DELETE /bucketPath/:id', function () {

    it('returns 403 as user does not have right to access resource',function(done){
      withRequestData({user: {_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          ras : {
            canAccessModifyResourcePath : function() { return false; }
          },
        });
        request(app)
          .delete('/yay')
          .expect(403, function (err, res) {
            revert();
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

    it('returns 400 as user has access but error is returned',function(done){
      withRequestData({user: {_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          ras : {
            canAccessModifyResourcePath : function() { return true; },
            resourceOwnerId: function(){return 123;}
          },
          bucketItemService: {
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
      withRequestData({user: {_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          ras : {
            canAccessModifyResourcePath : function() { return true; },
            resourceOwnerId: function(){return 123;}
          },
          bucketItemService: {
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
      withRequestData({user: {_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          ras : {
            canAccessModifyResourcePath : function() { return true; },
            resourceOwnerId: function(){return 123;},
            canModifyResource: function(){ return false; }
          },
          bucketItemService: {
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
      withRequestData({user: {_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          ras : {
            canAccessModifyResourcePath : function() { return true; },
            resourceOwnerId: function(){return 123;},
            canModifyResource: function(){ return true; }
          },
          bucketItemService: {
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

    it('returns 200 as delete succeeds',function(done){
      withRequestData({user: {_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          ras : {
            canAccessModifyResourcePath : function() { return true; },
            resourceOwnerId: function(){return 123;},
            canModifyResource: function(){ return true; }
          },
          bucketItemService: {
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
