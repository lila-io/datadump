var
  mongoose = require('mongoose'),
  datasource = require('../../../server/conf/datasource'),
  should = require('should'),
  BucketItem = require('../../../server/models/bucketItem'),
  Bucket = require('../../../server/models/bucket'),
  bucketItemService = require('../../../server/services/BucketItemService'),
  bucketService = require('../../../server/services/BucketService'),
  async = require('async')
;

describe('BucketItem service integration tests', function () {

  var dbString = datasource.testDbString();

  before(function(done){
    mongoose.connect(dbString,function(){
      BucketItem.ensureIndexes(done);
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
        bucketItemService.createOne();
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketItemService.createOne({},{},{},{});
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketItemService.createOne(null,null,null,function(){});
      }).should.throw(/^Illegal arguments/);

      done();
    });

    it('fails as bucket does not match', function (done) {

      var path = 'path';
      var itemData = 123;
      var userId = mongoose.Types.ObjectId();
      var otherId = mongoose.Types.ObjectId();
      var bucketData = {
        description: 'ha',
        path: path,
        user: userId
      };

      bucketService.createOne(bucketData,function(err,bucket){
        bucketItemService.createOne(otherId,path,itemData,function(err,item){
          should(err).not.be.ok;
          should(item).not.be.ok;
          done();
        });
      });
    });

    it('succeeds', function (done) {

      var path = 'path';
      var itemData = 123;
      var userId = mongoose.Types.ObjectId();
      var bucketData = {
        description: 'ha',
        path: path,
        user: userId
      };

      bucketService.createOne(bucketData,function(err,bucket){
        bucketItemService.createOne(userId,path,itemData,function(err,item){
          should(err).not.be.ok;
          should(item).be.ok;
          item.bucket.should.eql(bucket._id);
          item.data.should.eql(itemData);
          done();
        });
      });
    });

  });


  describe('show by id tests', function () {

    it('fails with invalid arguments', function (done) {

      (function() {
        bucketItemService.findOneById();
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketItemService.findOneById({},{});
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketItemService.findOneById(null,function(){});
      }).should.throw(/^Illegal arguments/);

      done();
    });

    it('does not find item', function (done) {

      var id = mongoose.Types.ObjectId();
      bucketItemService.findOneById(id,function(err,data){
        should(err).not.be.ok;
        should(data).not.be.ok;
        done();
      });

    });

    it('finds an item', function (done) {

      var path = 'path';
      var itemData = 123;
      var userId = mongoose.Types.ObjectId();
      var bucketData = {
        description: 'ha',
        path: path,
        user: userId
      };

      bucketService.createOne(bucketData,function(err,bucket){
        bucketItemService.createOne(userId,path,itemData,function(err,item){

          bucketItemService.findOneById(item._id,function(err,data){
            should(err).not.be.ok;
            should(data).be.ok;
            data.data.should.eql(123);
            done();
          });

        });
      });
    });
  });

  describe('show tests', function () {

    it('fails with invalid arguments', function (done) {

      (function() {
        bucketItemService.findOne();
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketItemService.findOne({},{},{},{});
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketItemService.findOne(null,null,null,function(){});
      }).should.throw(/^Illegal arguments/);

      done();
    });

    it('returns null as parent bucket is not found', function (done) {

      var id = mongoose.Types.ObjectId();
      var userId = mongoose.Types.ObjectId();
      bucketItemService.findOne(id,userId,'path',function(err,data){
        should(err).not.be.ok;
        should(data).not.be.ok;
        done();
      });

    });

    it('returns null as user is null', function (done) {

      var id = mongoose.Types.ObjectId();
      var userId = null;
      bucketItemService.findOne(id,userId,'path',function(err,data){
        should(err).not.be.ok;
        should(data).not.be.ok;
        done();
      });

    });

    it('returns null as path is null', function (done) {

      var id = mongoose.Types.ObjectId();
      var userId = mongoose.Types.ObjectId();
      bucketItemService.findOne(id,userId,null,function(err,data){
        should(err).not.be.ok;
        should(data).not.be.ok;
        done();
      });

    });

    it('does not find an item as bucket does not match', function (done) {

      var nonMatchingBucketId = mongoose.Types.ObjectId();
      var path = 'path';
      var itemData = 123;
      var userId = mongoose.Types.ObjectId();
      var bucketData = {
        description: 'ha',
        path: path,
        user: userId
      };

      bucketService.createOne(bucketData,function(err,bucket){
        bucketItemService.createOne(userId,path,itemData,function(err,item){

          bucketItemService.findOne(item._id,nonMatchingBucketId,path,function(err,data){
            should(err).not.be.ok;
            should(data).not.be.ok;
            done();
          });

        });
      });
    });


    it('finds an item with matching bucket', function (done) {

      var path = 'path';
      var itemData = 123;
      var userId = mongoose.Types.ObjectId();
      var bucketData = {
        description: 'ha',
        path: path,
        user: userId
      };

      bucketService.createOne(bucketData,function(err,bucket){
        should(err).not.be.ok;
        should(bucket).be.ok;

        bucketItemService.createOne(userId,path,itemData,function(err,item){
          should(err).not.be.ok;
          should(item).be.ok;

          bucketItemService.findOne(item._id,userId,path,function(err,data){
            should(err).not.be.ok;
            should(data).be.ok;
            data.data.should.eql(123);
            done();
          });

        });
      });
    });

  });

  describe('delete tests', function () {

    it('fails with invalid arguments', function (done) {

      (function() {
        bucketItemService.deleteOne();
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketItemService.deleteOne('wrong',{});
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketItemService.deleteOne({},{});
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketItemService.deleteOne(null, {}, function(){});
      }).should.throw(/^Illegal arguments/);

      done();
    });

    it('fails to delete non existent item', function (done) {

      var id = mongoose.Types.ObjectId();
      var userId = mongoose.Types.ObjectId();
      bucketItemService.deleteOne(id, userId, 'non-matching-path',function(err,data){
        should(err).not.be.ok;
        should(data).not.be.ok;
        done();
      });
    });

    it('fails to delete for wrong bucket', function (done) {

      var path = 'path';
      var itemData = 123;
      var userId = mongoose.Types.ObjectId();
      var bucketData = {
        description: 'ha',
        path: path,
        user: userId
      };

      bucketService.createOne(bucketData,function(err,bucket){
        should(err).not.be.ok;
        should(bucket).be.ok;

        bucketItemService.createOne(userId,path,itemData,function(err,item){
          should(err).not.be.ok;
          should(item).be.ok;

          bucketItemService.deleteOne(item._id, userId, 'non-matching-path',function(err,deletedData){
            should(err).not.be.ok;
            should(deletedData).not.be.ok;

            bucketItemService.findOneById(item._id,function(err,item){
              should(err).not.be.ok;
              should(item).be.ok;
              item.data.should.eql(123);
              done();
            });
          });

        });
      });
    });

    it('deletes an item for bucket', function (done) {

      var path = 'path';
      var itemData = 123;
      var userId = mongoose.Types.ObjectId();
      var bucketData = {
        description: 'ha',
        path: path,
        user: userId
      };

      bucketService.createOne(bucketData,function(err,bucket){
        should(err).not.be.ok;
        should(bucket).be.ok;

        bucketItemService.createOne(userId,path,itemData,function(err,item){
          should(err).not.be.ok;
          should(item).be.ok;

          bucketItemService.deleteOne(item._id, userId, path,function(err,deletedData){
            should(err).not.be.ok;
            should(deletedData).be.ok;

            bucketItemService.findOneById(deletedData._id,function(err,item){
              should(err).not.be.ok;
              should(item).not.be.ok;
              done();
            });
          });
        });
      });

    });
  });

  describe('list tests', function () {

    it('fails with invalid arguments', function (done) {

      // userId, bucketPath, searchQuery, options, cb

      (function() {
        bucketItemService.list();
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketItemService.list('1','1','1','1',function(){});
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketItemService.list(null,null,{},{},function(){});
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketItemService.list('1','1', null, null, function(){});
      }).should.throw(/^Illegal arguments/);

      done();
    });

    it('does not find anything', function (done) {

      bucketItemService.list(mongoose.Types.ObjectId(), '123', {}, {},function(err,items,total){
        should(err).not.be.ok;
        items.length.should.eql(0);
        total.should.eql(0);
        done();
      });
    });

    it('finds bucket bucketItems', function (done) {

      var path = 'path';
      var userId = mongoose.Types.ObjectId();
      var bucketData = {
        description: 'ha',
        path: path,
        user: userId
      };
      var bucketId = null;
      var addBucketItem = function(cb) {
        bucketItemService.createOne(userId,path,{hey:1,ho:[1,2,3]},function(err,data){
          cb(err,data);
        });
      };

      bucketService.createOne(bucketData,function(err,bucket){

        bucketId = bucket._id;

        async.parallel([
          addBucketItem, addBucketItem, addBucketItem, addBucketItem, addBucketItem, addBucketItem
        ], function(bucketItems){

          bucketItemService.list(userId, path, {}, {},function(err,items,total){
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

});
