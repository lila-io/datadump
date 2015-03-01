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

describe('Bucket Item router path tests', function () {

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
          .expect(404, function (err, res) {
            reqDone()
            if (err) return done(err);
            done();
          });
      });
    });
  });

  describe('GET /bucketPath', function () {

    it('returns 404 as no user present', function (done) {
      withRequestData({resourceOwnerType: UrlAccessType.GUEST}, function (reqDone) {
        request(app)
          .get('/some-user-path')
          .expect(404, function (err, res) {
            reqDone()
            if (err) return done(err);
            done();
          });
      });
    });

    it('returns 401 as cannot access list', function (done) {
      withRequestData({user:{_id:123},resourceOwner:{_id:'x'},resourceOwnerType: UrlAccessType.USER}, function (reqDone) {
        request(app)
          .get('/some-user-path')
          .expect(401, function (err, res) {
            reqDone()
            if (err) return done(err);
            done();
          });
      });
    });

    it('returns no items', function (done) {

      withRequestData({user:{_id:123},resourceOwner:{_id:123},resourceOwnerType: UrlAccessType.USER}, function (reqDone) {

        var revert = routerMock.__set__({
          bucketItemService: {
            list: function (uid, path, searchOpts, positionalOpts, cb) {
              uid.should.equal(123);
              path.should.equal('some-user-path');
              cb(null, [], 0);
            }
          }
        })
        request(app)
          .get('/some-user-path')
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

      withRequestData({user:{_id:123},resourceOwner:{_id:123},resourceOwnerType: UrlAccessType.ME}, function (reqDone) {

        var revert = routerMock.__set__({
          bucketItemService: {
            list: function (uid, path, searchOpts, positionalOpts, cb) {
              uid.should.equal(123);
              path.should.equal('some-user-path');
              cb(null, [{_id: 3}, {_id: 4}], 44);
            }
          }
        })
        request(app)
          .get('/some-user-path')
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

      withRequestData({user:{_id:123},resourceOwner:{_id:123},resourceOwnerType: UrlAccessType.ME}, function (reqDone) {

        var revert = routerMock.__set__({
          bucketItemService: {
            list: function (uid, path, searchOpts, positionalOpts, cb) {
              cb('arrgh');
            }
          }
        })
        request(app)
          .get('/some-user-path')
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

    it('rejects user on *user* path when requesting not own data', function (done) {
      withRequestData({user:{_id:123},resourceOwner:{_id:'x'},resourceOwnerType: UrlAccessType.USER}, function (reqDone) {
        request(app).get('/some-user-path').expect(401, function (err, res) {
          reqDone();
          if (err) return done(err);
          done();
        });
      });
    });

    it('rejects user on *admin* path, returning 404', function (done) {
      withRequestData({user:{_id:123},resourceOwner:{_id:123},resourceOwnerType: UrlAccessType.ADMIN}, function (reqDone) {
        request(app).get('/some-user-path').expect(404, function (err, res) {
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
          findOne: function (a, b, c, d) {
            a.should.equal('id');
            should(b).not.be.ok;
            c.should.equal('some-user-path');
            d('error');
          }
        }
      })
      request(app)
        .get('/some-user-path/id')
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
          findOne: function (a, b, c, d) {
            a.should.equal('id');
            should(b).not.be.ok;
            c.should.equal('some-user-path');
            d(null,null);
          }
        }
      })
      request(app)
        .get('/some-user-path/id')
        .expect(404, function (err, res) {
          revert();
          if (err) return done(err);
          done();
        });
    });

    it('returns with 403', function (done) {
      withRequestData({user:{_id:123},resourceOwner:{_id:'x'},resourceOwnerType: UrlAccessType.USER}, function (reqDone) {
        var revert = routerMock.__set__({
          bucketItemService: {
            findOne: function (a, b, c, d) {
              a.should.equal('itemId123');
              b.should.equal('x');
              c.should.equal('some-user-path');
              d(null, {isPublic: false});
            }
          }
        })
        var req = request(app);
        req.get('/some-user-path/itemId123')
          .expect(403, function (err, res) {
            revert();
            reqDone();
            if (err) return done(err);
            done();
          });
      });
    });

    it('returns public item', function (done) {
      var revert = routerMock.__set__({
        bucketItemService: {
          findOne: function (a, b, c, d) {
            a.should.equal('itemId123');
            should(b).not.be.ok;
            c.should.equal('some-user-path');
            d(null, {isPublic: true});
          }
        }
      })
      var req = request(app);
      req.get('/some-user-path/itemId123')
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
            createOne: function (user, bucket, data, cb) {
              cb('error')
            }
          }
        });
        request(app)
          .post('/some-user-path')
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
            createOne: function (user, bucket, data, cb) {
              cb(null,{_id:444})
            }
          }
        });
        request(app)
          .post('/some-user-path')
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

  });


  describe('DELETE /bucketPath/:id', function () {

    it('returns 403 as user does not have right to access resource',function(done){
      withRequestData({user: {_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          ras : {
            canAccessModifyResourcePath : function() { return false; }
          }
        });
        request(app)
          .delete('/some-user-path/yay')
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
            deleteOne: function(a,b,c,d){
              d('arrrgh')
            }
          }
        });
        request(app)
          .delete('/some-user-path/yay')
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

    it('returns 404 as user has access but parent bucket is not found',function(done){
      withRequestData({user: {_id:123}}, function (reqDone) {
        var revert = routerMock.__set__({
          ras : {
            canAccessModifyResourcePath : function() { return true; },
            resourceOwnerId: function(){return 123;}
          },
          bucketItemService: {
            deleteOne: function(a,b,c,d){
              d(null,null)
            }
          }
        });
        request(app)
          .delete('/some-user-path/yay')
          .set('Accept', 'application/json')
          .expect(404, function (err, res) {
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
            resourceOwnerId: function(){return 123;}
          },
          bucketItemService: {
            deleteOne: function(itemId, userId, path, cb){
              itemId.should.equal('yay');
              userId.should.equal(123);
              path.should.equal('some-user-path');
              cb(null,{});
            }
          }
        });
        request(app)
          .delete('/some-user-path/yay')
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
