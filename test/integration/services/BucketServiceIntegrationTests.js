var
  mongoose = require('mongoose'),
  datasource = require('../../../server/conf/datasource'),
  should = require('should'),
  Bucket = require('../../../server/models/bucket'),
  bucketService = require('../../../server/services/BucketService')
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
        data.data.length.should.eql(0);
        done();
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
      bucketService.findOne(id,null,function(err,data){
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
        user: userId,
        data: [{go:'far'}]
      };

      bucketService.createOne(opts,function(err,data){

        bucketService.findOne(data._id,null,function(err,data){
          should(err).not.be.ok;
          should(data).be.ok;
          data.data[0].go.should.eql('far');
          done();
        });

      });
    });

    it('finds does not find an item as user does not match', function (done) {

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

    it('finds finds an item with matching user', function (done) {

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

});
