var
  should = require('should'),
  bucketService = require('../../../server/services/BucketService'),
  async = require('async'),
  datasource = require('../../../server/conf/datasource')
;

describe('Bucket service integration tests', function () {

  before(function(done){
    datasource.truncateData().then(done);
  });

  after(function(done){
    done();
    datasource.truncateData().then(done);
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
        Object.keys(err.errors).should.have.length(1);

        err.errors.should.containEql({error:'username is required'});
        done();
      });

    });

    it('succeeds', function (done) {

      var opts = {
        name: 'myBucket',
        username: 'tallMan',
        description: 'long story short'
      };

      bucketService.createOne(opts,function(err,data){
        should(err).not.be.ok;

        data.id.should.be.ok;
        data.name.should.eql(opts.name);
        data.username.should.eql(opts.username);
        data.is_public.should.eql(false);
        data.description.should.eql(opts.description);

        done();
      });

    });

    it('fails to save duplicate as path has to be unique to user', function (done) {

      var opts = {
        name: 'myBucketWhichHasToBeUnique',
        username: 'tallMan',
        description: 'long story short'
      };

      bucketService.createOne(opts,function(err,data){

        should(err).not.be.ok;
        data.should.be.ok;

        bucketService.createOne(opts,function(err1,data1){

          should(data1).not.be.ok;
          err1.should.be.ok;

          Object.keys(err1.errors).should.have.length(1);
          err1.errors.should.containEql({error:'name should be unique'});
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

      var opts = {
        name: 'nameUnique',
        username: 'tallMan',
        description: 'long story short'
      };

      bucketService.createOne(opts,function(err,data){

        should(err).not.be.ok;
        data.should.be.ok;

        bucketService.updateOne(data.id, opts.username, {
          description: null,
          is_public: null
        },function(err1,data1){
          should(data1).not.be.ok;
          err1.should.be.ok;
          Object.keys(err1.errors).should.have.length(1);
          err1.errors.should.containEql({error:'is_public must be boolean'});
          done();
        });
      });

    });

    it('fails with validation error after trying to change primary key', function (done) {

      var opts = {
        name: 'nameUniquead',
        username: 'tallMan',
        description: 'long story short'
      };

      bucketService.createOne(opts,function(err,data){

        should(err).not.be.ok;
        data.should.be.ok;

        bucketService.updateOne(opts.name, opts.username, {
          username: 'adawd'
        },function(err1,data1){
          should(data1).not.be.ok;
          err1.should.be.ok;
          Object.keys(err1.errors).should.have.length(1);
          err1.errors.should.containEql({error:'username is part of primary key and cannot be changed'});
          done();
        });
      });

    });


    // TODO: check how upserts if no parent is found

    it('succeeds', function (done) {

      var opts = {
        name: 'nameUnique12345',
        username: 'tallMan',
        description: 'long story short'
      };

      bucketService.createOne(opts,function(err,data){

        should(err).not.be.ok;
        data.should.be.ok;

        bucketService.updateOne(data.id, opts.username, {
          description: 'new description',
          is_public: true
        },function(err1,data1){
          should(err1).not.be.ok;

          // update does not return updated entity
          should(data1).not.be.ok;

          //data1.should.be.ok;
          //data1.name.should.eql(opts.name);
          //data1.username.should.eql(opts.username);
          //data1.description.should.eql('new description');
          //data1.is_public.should.eql(true);
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

      bucketService.findOne('meeh',function(err,data){
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
