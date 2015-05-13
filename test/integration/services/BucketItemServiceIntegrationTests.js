var
  datasource = require('../../../server/conf/datasource'),
  should = require('should'),
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
        bucketItemService.createOne({},{},{});
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketItemService.createOne(null,null,function(){});
      }).should.throw(/^Illegal arguments/);

      done();
    });

    it('fails as bucket does not have an id', function (done) {

      var path = 'path';
      var itemData = 123;
      var userId = mongoose.Types.ObjectId();
      var bucketData = {
        description: 'ha',
        path: path,
        user: userId
      };

      (function() {
        bucketItemService.createOne(bucketData,itemData,function(err,item){});
      }).should.throw(/^Illegal arguments/);

      done();
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
        bucketItemService.createOne(bucket,itemData,function(err,item){
          should(err).not.be.ok;
          should(item).be.ok;
          item.bucket.should.eql(bucket._id);
          item.data.should.eql(itemData);
          done();
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
        bucketItemService.findOne({},{},{});
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketItemService.findOne(null,null,function(){});
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketItemService.findOne({},mongoose.Types.ObjectId(),function(){});
      }).should.throw(/^Illegal arguments/);

      done();
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
        bucketItemService.createOne(bucket,itemData,function(err,item){
          bucketItemService.findOne({_id:nonMatchingBucketId},item._id,function(err,data){
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

        bucketItemService.createOne(bucket,itemData,function(err,item){
          should(err).not.be.ok;
          should(item).be.ok;

          bucketItemService.findOne(bucket,item._id,function(err,data){
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
        bucketItemService.deleteOne('','',null);
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketItemService.deleteOne({},{},function(){});
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketItemService.deleteOne({},mongoose.Types.ObjectId(),function(){});
      }).should.throw(/^Illegal arguments/);

      done();
    });

    it('fails to delete non existent item', function (done) {
      var bucketId = mongoose.Types.ObjectId();
      var bucketItemId = mongoose.Types.ObjectId();
      bucketItemService.deleteOne({_id:bucketId}, bucketItemId, function(err,data){
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

        bucketItemService.createOne(bucket,itemData,function(err,item){
          should(err).not.be.ok;
          should(item).be.ok;

          bucketItemService.deleteOne({_id:mongoose.Types.ObjectId()}, item._id, function(err,deletedData){
            should(err).not.be.ok;
            should(deletedData).not.be.ok;

            bucketItemService.findOne(bucket,item._id,function(err,item){
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

        bucketItemService.createOne(bucket,itemData,function(err,item){
          should(err).not.be.ok;
          should(item).be.ok;

          bucketItemService.deleteOne(bucket, item._id, function(err,deletedData){
            should(err).not.be.ok;
            should(deletedData).be.ok;

            bucketItemService.findOne(bucket, item._id,function(err,item){
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
        bucketItemService.list('1','1','1',function(){});
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketItemService.list({},{},{},function(){});
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketItemService.list({_id:mongoose.Types.ObjectId()},{},{}, function(){});
      }).should.not.throw(/^Illegal arguments/);

      done();
    });

    it('does not find anything', function (done) {

      bucketItemService.list({_id:mongoose.Types.ObjectId()}, {}, {},function(err,items,total){
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
      var buck = null;
      var addBucketItem = function(cb) {
        bucketItemService.createOne(buck,{hey:1,ho:[1,2,3]},function(err,data){
          cb(err,data);
        });
      };

      bucketService.createOne(bucketData,function(err,bucket){
        buck = bucket;

        async.parallel([
          addBucketItem, addBucketItem, addBucketItem, addBucketItem, addBucketItem, addBucketItem
        ], function(bucketItems){

          bucketItemService.list(buck, {}, {},function(err,items,total){
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
