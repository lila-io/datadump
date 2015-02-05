var
  mongoose = require('mongoose'),
  datasource = require('../../../server/conf/datasource'),
  should = require('should'),
  BucketItem = require('../../../server/models/bucketItem'),
  bucketItemService = require('../../../server/services/BucketItemService'),
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
        bucketItemService.createOne('wrong',{});
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketItemService.createOne(null,{},function(){});
      }).should.throw(/^Illegal arguments/);

      done();
    });

    it('succeeds', function (done) {

      var id = mongoose.Types.ObjectId();

      bucketItemService.createOne(id,{some:'data'},function(err,data){
        should(err).not.be.ok;
        data._id.should.be.ok;
        data.bucket.should.eql(id);
        data.data.some.should.eql('data');
        done();
      });
    });

  });


  describe('update tests', function () {

    it('fails with invalid arguments', function (done) {

      (function() {
        bucketItemService.updateOne();
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketItemService.updateOne('wrong',{});
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketItemService.updateOne(null, null, {}, function(){});
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketItemService.updateOne(null, {}, function(){});
      }).should.throw(/^Illegal arguments/);

      done();
    });

    it('fails with validation errors after trying to set nulls', function (done) {

      var id = mongoose.Types.ObjectId();
      var data = 'xyz';

      bucketItemService.createOne(id,data,function(err,data){
        should(err).not.be.ok;
        data._id.should.be.ok;

        bucketItemService.updateOne(data._id, {
          data: null
        },function(err1,data1){
          should(data1).not.be.ok;
          err1.should.be.ok;
          Object.keys(err1.errors).should.have.length(1);
          err1.errors.should.have.keys('data');
          done();
        });
      });

    });

    it('fails as item is not found', function (done) {

      var id = mongoose.Types.ObjectId();

      bucketItemService.updateOne(id, {}, function(err,data){
        should(data).not.be.ok;
        err.should.be.ok;
        done();
      });

    });

    it('fails as wrong bucketId is passed', function (done) {

      var id = mongoose.Types.ObjectId();
      var id2 = mongoose.Types.ObjectId();

      bucketItemService.createOne(id, 'xyz', function(err,data){
        should(err).not.be.ok;
        data._id.should.be.ok;

        bucketItemService.updateOne(data._id, id2, {
          data: 'new data'
        },function(err1,data1){
          should(data1).not.be.ok;
          err1.should.be.ok;
          done();
        });
      });
    });

    it('succeeds', function (done) {

      var id = mongoose.Types.ObjectId();

      bucketItemService.createOne(id, 12345,function(err,data){
        should(err).not.be.ok;
        data._id.should.be.ok;
        data.data.should.eql(12345);

        bucketItemService.updateOne(data._id, {
          data: 54321
        },function(err1,data1){
          should(err1).not.be.ok;
          data1.should.be.ok;
          data1.data.should.eql(54321);
          done();
        });
      });
    });

    it('succeeds with owner', function (done) {

      var id = mongoose.Types.ObjectId();
      var payload = [1,2,3]

      bucketItemService.createOne(id, payload,function(err,data){
        should(err).not.be.ok;
        data._id.should.be.ok;
        data.data.should.eql(payload);

        bucketItemService.updateOne(data._id, id, {
          data: 'aha'
        },function(err1,data1){
          should(err1).not.be.ok;
          data1.should.be.ok;
          data1.data.should.eql('aha');
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

      done();
    });

    it('does not find item', function (done) {

      var id = mongoose.Types.ObjectId();
      bucketItemService.findOne(id,function(err,data){
        should(err).not.be.ok;
        should(data).not.be.ok;
        done();
      });

    });

    it('finds item without owner', function (done) {

      var id = mongoose.Types.ObjectId();
      var data = {hey:'ho'};

      bucketItemService.createOne(id,data,function(err,data){

        bucketItemService.findOne(data._id,function(err,data){
          should(err).not.be.ok;
          should(data).be.ok;
          data.data.hey.should.eql('ho');
          done();
        });

      });
    });

    it('does not find an item as bucket does not match', function (done) {

      var id = mongoose.Types.ObjectId();
      var otherId = mongoose.Types.ObjectId();
      var data = 123

      bucketItemService.createOne(id,data,function(err,data){

        bucketItemService.findOne(data._id,otherId,function(err,data){
          should(err).not.be.ok;
          should(data).not.be.ok;
          done();
        });

      });
    });

    it('finds an item with matching bucket', function (done) {

      var id = mongoose.Types.ObjectId();
      var data = false;

      bucketItemService.createOne(id,data,function(err,data){

        bucketItemService.findOne(data._id,id,function(err,data){
          should(err).not.be.ok;
          should(data).be.ok;
          data.data.should.eql(false);
          done();
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
      bucketItemService.deleteOne(id,function(err,data){
        should(err).not.be.ok;
        should(data).not.be.ok;
        done();
      });
    });

    it('fails to delete for wrong bucket', function (done) {

      var id = mongoose.Types.ObjectId();
      var otherId = mongoose.Types.ObjectId();
      var data = 'x'

      bucketItemService.createOne(id, data, function(err,data){

        bucketItemService.deleteOne(data._id, otherId,function(err,deletedData){
          should(err).not.be.ok;
          should(deletedData).not.be.ok;

          bucketItemService.findOne(data._id,function(err,item){
            should(err).not.be.ok;
            should(item).be.ok;
            item.data.should.eql('x');
            done();
          });
        });
      });
    });

    it('deletes an item', function (done) {

      var id = mongoose.Types.ObjectId();
      var data = 098765;

      bucketItemService.createOne(id, data, function(err,data){

        bucketItemService.deleteOne(data._id,function(err,deletedData){
          should(err).not.be.ok;
          should(deletedData).be.ok;

          bucketItemService.findOne(deletedData._id,function(err,item){
            should(err).not.be.ok;
            should(item).not.be.ok;
            done();
          });
        });
      });
    });

    it('deletes an item for bucket', function (done) {

      var id = mongoose.Types.ObjectId();
      var data = ['x','y','z']

      bucketItemService.createOne(id, data, function(err,data){

        bucketItemService.deleteOne(data._id, id, function(err,deletedData){
          should(err).not.be.ok;
          should(deletedData).be.ok;

          bucketItemService.findOne(deletedData._id,function(err,item){
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
        bucketItemService.list();
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketItemService.list('wrong',{});
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketItemService.list({},{});
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketItemService.list(null, {}, function(){});
      }).should.throw(/^Illegal arguments/);

      done();
    });

    it('does not find anything', function (done) {

      bucketItemService.list({bucket:mongoose.Types.ObjectId()},function(err,items,total){
        should(err).not.be.ok;
        items.length.should.eql(0);
        total.should.eql(0);
        done();
      });
    });

    it('finds bucket bucketItems', function (done) {

      var bucketId = mongoose.Types.ObjectId();
      var addBucketItem = function(cb) {
        bucketItemService.createOne(bucketId,{hey:1,ho:[1,2,3]},function(err,data){
          cb(err,data);
        });
      };

      var createSomeBucketItems = [
        addBucketItem, addBucketItem, addBucketItem, addBucketItem, addBucketItem, addBucketItem
      ];

      async.parallel(createSomeBucketItems, function(bucketItems){

        bucketItemService.list({bucket:bucketId},function(err,items,total){
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
