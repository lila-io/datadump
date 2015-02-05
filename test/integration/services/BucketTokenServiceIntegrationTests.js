var
  mongoose = require('mongoose'),
  datasource = require('../../../server/conf/datasource'),
  should = require('should'),
  BucketToken = require('../../../server/models/bucketToken'),
  bucketTokenService = require('../../../server/services/BucketTokenService'),
  async = require('async')
;

describe('BucketToken schema integration tests', function () {

  var dbString = datasource.testDbString();

  before(function(done){
    mongoose.connect(dbString,function(){
      BucketToken.ensureIndexes(done);
    });
  });

  after(function(done){
    mongoose.connection.db.dropDatabase(function(){
      mongoose.disconnect(done);
    });
  });

  describe('save tests', function () {

    it('fails with invalid arguments', function (done) {

      (function() {
        bucketTokenService.createOne();
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketTokenService.createOne('wrong',{});
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketTokenService.createOne({},{});
      }).should.throw(/^Illegal arguments/);

      done();
    });

    it('succeeds', function (done) {

      var id = mongoose.Types.ObjectId();
      var opts = {
        description: 'ha',
        path: 'ho',
        user: id
      };

      bucketTokenService.createOne(id,function(err,data){
        should(err).not.be.ok;
        data._id.should.be.ok;
        data.bucket.should.eql(id);
        data.token.should.be.ok;
        done();
      });
    });
  });


  describe('show tests', function () {

    it('fails with invalid arguments', function (done) {

      (function() {
        bucketTokenService.findOne();
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketTokenService.findOne(null, function(){});
      }).should.throw(/^Illegal arguments/);

      done();
    });

    it('does not find item', function (done) {

      bucketTokenService.findOne('123',function(err,data){
        should(err).not.be.ok;
        should(data).not.be.ok;
        done();
      });
    });

    it('finds item', function (done) {

      var bucketId = mongoose.Types.ObjectId();

      bucketTokenService.createOne(bucketId,function(err,data){

        bucketTokenService.findOne(data.token,function(err,data){
          should(err).not.be.ok;
          should(data).be.ok;
          data.bucket.should.eql(bucketId);
          done();
        });
      });
    });
  });

  describe('delete tests', function () {

    it('fails with invalid arguments', function (done) {

      (function() {
        bucketTokenService.deleteOne();
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketTokenService.deleteOne('wrong',{});
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketTokenService.deleteOne({},{});
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketTokenService.deleteOne(null, {}, function(){});
      }).should.throw(/^Illegal arguments/);

      done();
    });

    it('fails to delete non existent item', function (done) {

      var id = mongoose.Types.ObjectId();
      bucketTokenService.deleteOne(id,function(err,data){
        should(err).not.be.ok;
        should(data).not.be.ok;
        done();
      });
    });

    it('deletes an item', function (done) {

      var bucketId = mongoose.Types.ObjectId();

      bucketTokenService.createOne(bucketId,function(err,data){

        bucketTokenService.deleteOne(data._id,function(err,deletedData){
          should(err).not.be.ok;
          should(deletedData).be.ok;

          bucketTokenService.findOne(bucketId,function(err,item){
            should(err).not.be.ok;
            should(item).not.be.ok;
            done();
          });
        });
      });
    });
  });

  describe('list tests', function () {

    it('fails with invalid arguments', function (done) {

      (function() {
        bucketTokenService.list();
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketTokenService.list('wrong',{});
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketTokenService.list({},{});
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketTokenService.list(null, {}, function(){});
      }).should.throw(/^Illegal arguments/);

      done();
    });

    it('does not find anything', function (done) {

      bucketTokenService.list(mongoose.Types.ObjectId(),function(err,items,total){
        should(err).not.be.ok;
        items.length.should.eql(0);
        total.should.eql(0);
        done();
      });
    });

    it('finds items', function (done) {

      var bucketId = mongoose.Types.ObjectId();
      var addBucketToken = function(cb) {
        bucketTokenService.createOne(bucketId,function(err,data){
          cb(data);
        });
      };

      var createSomeBucketTokens = [
        addBucketToken, addBucketToken, addBucketToken, addBucketToken, addBucketToken, addBucketToken
      ]

      async.parallel(createSomeBucketTokens, function(buckets){

        bucketTokenService.list(bucketId,function(err,items,total){
          should(err).not.be.ok;
          items.length.should.eql(6);
          total.should.eql(6);
          items[0].dateCreated.getTime().should.be.above(items[5].dateCreated.getTime());
          done();
        });

      });
    });
  });

});
