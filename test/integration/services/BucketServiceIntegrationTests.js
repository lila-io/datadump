var
  mongoose = require('mongoose'),
  datasource = require('../../../server/conf/datasource'),
  should = require('should'),
  Bucket = require('../../../server/models/bucket'),
  bucketService = require('../../../server/services/BucketService'),
  async = require('async')
;

describe('Bucket schema integration tests', function () {

  var dbString = datasource.testDbString();

  before(function(done){
    mongoose.connect(dbString,function(){
      Bucket.ensureIndexes(done);
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
        bucketService.createOne();
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketService.createOne('wrong',{});
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketService.createOne({},{});
      }).should.throw(/^Illegal arguments/);

      done();
    });

    it('fails with default data', function (done) {

      bucketService.createOne({},function(err,data){
        should(data).not.be.ok;
        err.should.be.ok;
        Object.keys(err.errors).should.have.length(3);
        err.errors.should.have.keys('description', 'path', 'user');
        done();
      });

    });

    it('succeeds', function (done) {

      var id = mongoose.Types.ObjectId();
      var opts = {
        description: 'ha',
        path: 'ho',
        user: id
      };

      bucketService.createOne(opts,function(err,data){
        should(err).not.be.ok;
        data._id.should.be.ok;
        data.description.should.eql(opts.description);
        data.path.should.eql(opts.path);
        data.user.should.eql(id);
        data.isPublic.should.eql(false);
        done();
      });

    });

    it('fails to save duplicate as path has to be unique to user', function (done) {

      var id = mongoose.Types.ObjectId();
      var opts = {
        description: 'ha',
        path: 'ho',
        user: id
      };

      bucketService.createOne(opts,function(err,data){
        should(err).not.be.ok;
        data._id.should.be.ok;

        bucketService.createOne(opts,function(err1,data1){
          should(data1).not.be.ok;
          err1.should.be.ok;
          Object.keys(err1.errors).should.have.length(1);
          err1.errors.should.have.keys('path');
          err1.errors.path.message.should.eql('Bucket path should be unique');
          done();
        });
      });

    });

  });


  describe('update tests', function () {

    it('fails with invalid arguments', function (done) {

      (function() {
        bucketService.updateOne();
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketService.updateOne('wrong',{});
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketService.updateOne({},{});
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketService.updateOne(null, {}, function(){});
      }).should.throw(/^Illegal arguments/);

      done();
    });

    it('fails with validation errors after trying to set nulls', function (done) {

      var id = mongoose.Types.ObjectId();
      var opts = {
        description: 'ha',
        path: 'ho',
        user: id
      };

      bucketService.createOne(opts,function(err,data){
        should(err).not.be.ok;
        data._id.should.be.ok;

        bucketService.updateOne(data._id, {
          description: null,
          path: null,
          user: null
        },function(err1,data1){
          should(data1).not.be.ok;
          err1.should.be.ok;
          Object.keys(err1.errors).should.have.length(3);
          err1.errors.should.have.keys('description', 'path', 'user');
          done();
        });
      });

    });

    it('fails as item is not found', function (done) {

      var id = mongoose.Types.ObjectId();

      bucketService.updateOne(id, {}, function(err,data){
        should(data).not.be.ok;
        err.should.be.ok;
        done();
      });

    });

    it('fails as wrong owner is passed', function (done) {

      var id = mongoose.Types.ObjectId();
      var id2 = mongoose.Types.ObjectId();
      var opts = {
        description: 'ha',
        path: 'ho',
        user: id
      };

      bucketService.createOne(opts,function(err,data){
        should(err).not.be.ok;
        data._id.should.be.ok;

        bucketService.updateOne(data._id, id2, {
          description: 'new description',
          path: 'new path',
          user: id2
        },function(err1,data1){
          should(data1).not.be.ok;
          err1.should.be.ok;
          done();
        });
      });
    });

    it('succeeds', function (done) {

      var id = mongoose.Types.ObjectId();
      var id2 = mongoose.Types.ObjectId();
      var opts = {
        description: 'ha',
        path: 'ho',
        user: id
      };

      bucketService.createOne(opts,function(err,data){
        should(err).not.be.ok;
        data._id.should.be.ok;

        bucketService.updateOne(data._id, {
          description: 'new description',
          path: 'new path',
          user: id2
        },function(err1,data1){
          should(err1).not.be.ok;
          data1.should.be.ok;
          data1.description.should.eql('new description');
          data1.path.should.eql('new path');
          data1.user.should.eql(id2);
          done();
        });
      });
    });

    it('succeeds with owner', function (done) {

      var id = mongoose.Types.ObjectId();
      var id2 = mongoose.Types.ObjectId();
      var opts = {
        description: 'ha',
        path: 'ho',
        user: id
      };

      bucketService.createOne(opts,function(err,data){
        should(err).not.be.ok;
        data._id.should.be.ok;

        bucketService.updateOne(data._id, id, {
          description: 'new description',
          path: 'new path',
          user: id2
        },function(err1,data1){
          should(err1).not.be.ok;
          data1.should.be.ok;
          data1.description.should.eql('new description');
          data1.path.should.eql('new path');
          data1.user.should.eql(id2);
          done();
        });
      });
    });
  });


  describe('show tests', function () {

    it('fails with invalid arguments', function (done) {

      (function() {
        bucketService.findOne();
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketService.findOne({},{},{});
      }).should.throw(/^Illegal arguments/);

      done();
    });

    it('does not find item', function (done) {

      var id = mongoose.Types.ObjectId();
      bucketService.findOne(id,function(err,data){
        should(err).not.be.ok;
        should(data).not.be.ok;
        done();
      });

    });

    it('finds item without owner', function (done) {

      var userId = mongoose.Types.ObjectId();
      var opts = {
        description: 'ha',
        path: 'ho',
        user: userId
      };

      bucketService.createOne(opts,function(err,data){

        bucketService.findOne(data._id,function(err,data){
          should(err).not.be.ok;
          should(data).be.ok;
          data.description.should.eql('ha');
          done();
        });

      });
    });

    it('does not find an item as user does not match', function (done) {

      var userId = mongoose.Types.ObjectId();
      var otherId = mongoose.Types.ObjectId();
      var opts = {
        description: 'ha',
        path: 'ho',
        user: userId
      };

      bucketService.createOne(opts,function(err,data){

        bucketService.findOne(data._id,otherId,function(err,data){
          should(err).not.be.ok;
          should(data).not.be.ok;
          done();
        });

      });
    });

    it('finds an item with matching user', function (done) {

      var userId = mongoose.Types.ObjectId();
      var opts = {
        description: 'ha',
        path: 'ho',
        user: userId
      };

      bucketService.createOne(opts,function(err,data){

        bucketService.findOne(data._id,userId,function(err,data){
          should(err).not.be.ok;
          should(data).be.ok;
          done();
        });

      });
    });

  });

  describe('find by user and path tests', function () {

    it('fails with invalid arguments', function (done) {

      (function() {
        bucketService.findOneByUserAndPath();
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketService.findOneByUserAndPath({},{},{});
      }).should.throw(/^Illegal arguments/);

      done();
    });

    it('does not find item', function (done) {

      var id = mongoose.Types.ObjectId();
      bucketService.findOneByUserAndPath(id,'/path',function(err,data){
        should(err).not.be.ok;
        should(data).not.be.ok;
        done();
      });

    });

    it('does not find an item as user does not match', function (done) {

      var userId = mongoose.Types.ObjectId();
      var otherId = mongoose.Types.ObjectId();
      var opts = {
        description: 'ha',
        path: '/path',
        user: userId
      };

      bucketService.createOne(opts,function(err,data){

        bucketService.findOneByUserAndPath(otherId,'/path',function(err,data){
          should(err).not.be.ok;
          should(data).not.be.ok;
          done();
        });

      });
    });

    it('finds an item with matching user', function (done) {

      var userId = mongoose.Types.ObjectId();
      var opts = {
        description: 'ha',
        path: 'path',
        user: userId
      };

      bucketService.createOne(opts,function(err,data){

        bucketService.findOneByUserAndPath(userId,'path',function(err,data){
          should(err).not.be.ok;
          should(data).be.ok;
          done();
        });

      });
    });

  });

  describe('delete tests', function () {

    it('fails with invalid arguments', function (done) {

      (function() {
        bucketService.deleteOne();
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketService.deleteOne('wrong',{});
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketService.deleteOne({},{});
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketService.deleteOne(null, {}, function(){});
      }).should.throw(/^Illegal arguments/);

      done();
    });

    it('fails to delete non existent item', function (done) {

      var id = mongoose.Types.ObjectId();
      bucketService.deleteOne(id,function(err,data){
        should(err).not.be.ok;
        should(data).not.be.ok;
        done();
      });
    });

    it('fails to delete for wrong user', function (done) {

      var userId = mongoose.Types.ObjectId();
      var otherUserId = mongoose.Types.ObjectId();
      var opts = {
        description: 'ha',
        path: 'ho',
        user: userId
      };

      bucketService.createOne(opts,function(err,data){

        bucketService.deleteOne(data._id, otherUserId,function(err,deletedData){
          should(err).not.be.ok;
          should(deletedData).not.be.ok;

          bucketService.findOne(data._id,function(err,item){
            should(err).not.be.ok;
            should(item).be.ok;
            done();
          });
        });
      });
    });

    it('deletes an item', function (done) {

      var userId = mongoose.Types.ObjectId();
      var opts = {
        description: 'ha',
        path: 'ho',
        user: userId
      };

      bucketService.createOne(opts,function(err,data){

        bucketService.deleteOne(data._id,function(err,deletedData){
          should(err).not.be.ok;
          should(deletedData).be.ok;

          bucketService.findOne(deletedData._id,function(err,item){
            should(err).not.be.ok;
            should(item).not.be.ok;
            done();
          });
        });
      });
    });

    it('deletes an item for user', function (done) {

      var userId = mongoose.Types.ObjectId();
      var opts = {
        description: 'ha',
        path: 'ho',
        user: userId
      };

      bucketService.createOne(opts,function(err,data){

        bucketService.deleteOne(data._id, userId, function(err,deletedData){
          should(err).not.be.ok;
          should(deletedData).be.ok;

          bucketService.findOne(deletedData._id,function(err,item){
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
        bucketService.list();
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketService.list('wrong',{});
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketService.list({},{});
      }).should.throw(/^Illegal arguments/);

      (function() {
        bucketService.list(null, {}, function(){});
      }).should.throw(/^Illegal arguments/);

      done();
    });

    it('does not find anything', function (done) {

      bucketService.list({user:mongoose.Types.ObjectId()},function(err,items,total){
        should(err).not.be.ok;
        items.length.should.eql(0);
        total.should.eql(0);
        done();
      });
    });

    it('finds user buckets', function (done) {

      var userId = mongoose.Types.ObjectId();
      var addBucket = function(cb) {
        bucketService.createOne({
          description: 'ha',
          path: 'ho' + Math.random(),
          user: userId
        },function(err,data){
          cb(data);
        });
      };

      var createSomeBuckets = [
        addBucket, addBucket, addBucket, addBucket, addBucket, addBucket
      ]

      async.parallel(createSomeBuckets, function(buckets){

        bucketService.list({user:userId},function(err,items,total){
          should(err).not.be.ok;
          items.length.should.eql(6);
          total.should.eql(6);
          items[0].dateCreated.getTime().should.be.above(items[5].dateCreated.getTime())
          done();
        });

      });
    });
  });

});
