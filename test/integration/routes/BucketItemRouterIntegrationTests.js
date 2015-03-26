var
  request = require('supertest'),
  bodyParser = require('body-parser'),
  rewire = require("rewire"),
  should = require('should'),
  express = require('express'),
  UrlAccessType = require('../../../server/lib/UrlAccessType'),
  EditableRouteMiddleware = require('../../IntegrationTestHelpers').EditableRouteMiddleware,
  app,
  router = rewire('../../../server/routes/bucketItem');
;

describe('bucket item router path tests', function () {

  var editable = new EditableRouteMiddleware();

  before(function(){
    app = express();
    app.use(bodyParser.json());
    app.use(editable.editableMiddleware());
    router.__set__({
      allowAll:function(req,res,next){ next() },
      allowUser:function(req,res,next){ next() }
    })
    app.use(router);
  });

  after(function(){
  });

  describe('loadVisibleBucket() tests',function(){

    var testFn = router.__get__('loadVisibleBucket');

    it('returns error as user id is not set in request', function(done){
      var status,
        data,
        req = {},
        res = {
          status: function(n){ status = n; return res; },
          send: function(obj){ data = obj; },
          end: function(){}
        },
        next = function(){};

      should.not.exist( testFn(req,res,next) );
      status.should.eql( 400 );
      data.errors[0].should.eql( 'User not found in path' );
      done();
    });

    it('returns error as requires bucket id parameter to be present', function(done){

      var status,
        data,
        req = { resourceOwner: {_id:'123456'} },
        res = {
          status: function(n){ status = n; return res; },
          send: function(obj){ data = obj; },
          end: function(){}
        },
        next = function(){};

      should.not.exist( testFn(req,res,next) );
      status.should.eql( 400 );
      data.errors[0].should.eql( 'Bucket not found in path' );
      done();

    });

    it('fails with service error', function (done) {
      var revert = router.__set__({
        bucketService: {
          findOne: function (a, b, c) {
            c('myError')
          }
        }
      });
      var status,
        data,
        req = { resourceOwner: {_id:'123456'}, params: {bucketId: '123456'} },
        res = {
          status: function(n){ status = n; return res; },
          send: function(obj){ data = obj; },
          end: function(){}
        },
        next = function(){};

      should.not.exist( testFn(req,res,next) );
      status.should.eql( 400 );
      data.errors[0].should.eql( 'myError' );
      revert();
      done();

    });

    it('returns with 404 if no bucket is found', function (done) {
      var revert = router.__set__({
        bucketService: {
          findOne: function (a, b, c) {
            c(null, null)
          }
        }
      })
      var status,
        data,
        req = { resourceOwner: {_id:'123456'}, params: {bucketId: '123456'} },
        res = {
          status: function(n){ status = n; return res; },
          send: function(obj){ data = obj; },
          end: function(){}
        },
        next = function(){};

      should.not.exist( testFn(req,res,next) );
      status.should.eql( 404 );
      should.not.exist( data );
      revert();
      done();
    });

    it('returns with 403 as user does not have access to bucket', function (done) {
      var revert = router.__set__({
        bucketService: {
          findOne: function (a, b, c) {
            c(null, {isPublic: false})
          }
        }
      })
      var status,
        data,
        req = { user:{_id:'x'}, resourceOwner: {_id:'123456'}, params: {bucketId: '123456'} },
        res = {
          status: function(n){ status = n; return res; },
          send: function(obj){ data = obj; },
          end: function(){}
        },
        next = function(){};

      should.not.exist( testFn(req,res,next) );
      status.should.eql( 403 );
      should.not.exist( data );
      revert();
      done();
    });

    it('returns public bucket', function (done) {
      var revert = router.__set__({
        bucketService: {
          findOne: function (a, b, c) {
            c(null, {_id:'someBucketId',isPublic: true})
          }
        }
      })
      var status, data, fnError, fnData
        req = { user:{_id:'x'}, resourceOwner: {_id:'123456'}, params: {bucketId: '123456'} },
        res = {
          status: function(n){ status = n; return res; },
          send: function(obj){ data = obj; },
          end: function(){}
        },
        next = function(err,itemData){ fnError = err, fnData = itemData; };

      should.not.exist( testFn(req,res,next) );
      should.not.exist( status );
      should.not.exist( data );
      should.not.exist( fnError );
      fnData._id.should.eql('someBucketId');
      revert();
      done();
    });

    it('returns private bucket', function (done) {
      var revert = router.__set__({
        bucketService: {
          findOne: function (a, b, c) {
            c(null, {_id:'someBucketId',isPublic: false, user:'123456'})
          }
        }
      })
      var status, data, fnError, fnData,
        req = { user:{_id:'123456'}, resourceOwner: {_id:'123456'}, resourceOwnerType: UrlAccessType.ME, params: {bucketId: 'x'} },
        res = {
          status: function(n){ status = n; return res; },
          send: function(obj){ data = obj; },
          end: function(){}
        },
        next = function(err,itemData){ fnError = err, fnData = itemData; };

      should.not.exist( testFn(req,res,next) );
      should.not.exist( status );
      should.not.exist( data );
      should.not.exist( fnError );
      fnData._id.should.eql('someBucketId');
      revert();
      done();
    });

  });

  describe('loadEditableBucket() tests',function(){

    var testFn = router.__get__('loadEditableBucket');

    it('returns 404 if on guest path', function(done){
      var status,
        data,
        req = {},
        res = {
          status: function(n){ status = n; return res; },
          send: function(obj){ data = obj; },
          end: function(){}
        },
        next = function(){};

      should.not.exist( testFn(req,res,next) );
      status.should.eql( 404 );
      done();
    });

    it('returns 404 if bucket is not present on path', function(done){
      var status,
        data,
        req = { resourceOwnerType: UrlAccessType.ME },
        res = {
          status: function(n){ status = n; return res; },
          send: function(obj){ data = obj; },
          end: function(){}
        },
        next = function(){};

      should.not.exist( testFn(req,res,next) );
      status.should.eql( 404 );
      done();
    });

    it('returns 401 if anonymous', function(done){
      var status,
        data,
        req = { resourceOwnerType: UrlAccessType.ME, params: {bucketId:'123456'} },
        res = {
          status: function(n){ status = n; return res; },
          send: function(obj){ data = obj; },
          end: function(){}
        },
        next = function(){};

      should.not.exist( testFn(req,res,next) );
      status.should.eql( 401 );
      done();
    });

    it('returns 403 if not allowed to access resource path', function(done){
      var status,
        data,
        req = { user:{_id:1}, resourceOwnerType: UrlAccessType.USER, params: {bucketId:'123456'} },
        res = {
          status: function(n){ status = n; return res; },
          send: function(obj){ data = obj; },
          end: function(){}
        },
        next = function(){};

      should.not.exist( testFn(req,res,next) );
      status.should.eql( 403 );
      done();
    });

    it('fails with service error', function (done) {
      var revert = router.__set__({
        bucketService: {
          findOne: function (a, b, c) {
            c('myError')
          }
        }
      });
      var status,
        data,
        req = { user:{_id:1}, resourceOwner: {_id:1}, resourceOwnerType: UrlAccessType.USER, params: {bucketId: '123456'} },
        res = {
          status: function(n){ status = n; return res; },
          send: function(obj){ data = obj; },
          end: function(){}
        },
        next = function(){};

      should.not.exist( testFn(req,res,next) );
      status.should.eql( 400 );
      data.errors[0].should.eql( 'myError' );
      revert();
      done();

    });

    it('returns with 404 if no bucket is found', function (done) {
      var revert = router.__set__({
        bucketService: {
          findOne: function (a, b, c) {
            c(null, null)
          }
        }
      })
      var status,
        data,
        req = { user:{_id:1}, resourceOwner: {_id:1}, resourceOwnerType: UrlAccessType.USER, params: {bucketId: '123456'} },
        res = {
          status: function(n){ status = n; return res; },
          send: function(obj){ data = obj; },
          end: function(){}
        },
        next = function(){};

      should.not.exist( testFn(req,res,next) );
      status.should.eql( 404 );
      should.not.exist( data );
      revert();
      done();
    });

    it('returns with 403 as user cannot modify bucket', function (done) {
      var revert = router.__set__({
        bucketService: {
          findOne: function (a, b, c) {
            c(null, {user:'y', isPublic: true})
          }
        }
      })
      var status,
        data,
        req = { user:{_id:1}, resourceOwner: {_id:1}, resourceOwnerType: UrlAccessType.USER, params: {bucketId: '123456'} },
        res = {
          status: function(n){ status = n; return res; },
          send: function(obj){ data = obj; },
          end: function(){}
        },
        next = function(){};

      should.not.exist( testFn(req,res,next) );
      status.should.eql( 403 );
      should.not.exist( data );
      revert();
      done();
    });

    it('returns private owner bucket', function (done) {
      var revert = router.__set__({
        bucketService: {
          findOne: function (a, b, c) {
            c(null, {_id:'someBucketId', user:'123456', isPublic: true})
          }
        }
      })
      var status, data, fnError, fnData,
        req = { user:{_id:'123456'}, resourceOwner: {_id:'123456'}, resourceOwnerType: UrlAccessType.ME, params: {bucketId: 'x'} },
        res = {
          status: function(n){ status = n; return res; },
          send: function(obj){ data = obj; },
          end: function(){}
        },
        next = function(err,itemData){ fnError = err, fnData = itemData; };

      should.not.exist( testFn(req,res,next) );
      should.not.exist( status );
      should.not.exist( data );
      should.not.exist( fnError );
      fnData._id.should.eql('someBucketId');
      revert();
      done();
    });

  });

});
