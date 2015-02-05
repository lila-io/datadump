var
  mongoose = require('mongoose'),
  datasource = require('../../../server/conf/datasource'),
  should = require('should'),
  Bucket = require('../../../server/models/bucket')
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

  describe('constraints tests', function () {

    it('fails if trying to save default instance', function (done) {
      Bucket.create({},function(err){
        err.errors.should.be.an.Object;
        Object.keys(err.errors).length.should.equal(3);
        Object.keys(err.errors).should.containDeep(['path', 'description', 'user'])
        done();
      });
    });

    it('fails if required fields are blank',function(done){

      Bucket.create({
        user: '',
        description: '',
        path: '',
        dateCreated: '',
        isPublic: '',
        data: ''
      },function(err){
        err.errors.should.be.an.Object;
        Object.keys(err.errors).length.should.equal(5);
        Object.keys(err.errors).should.containDeep(['isPublic', 'path', 'description', 'user', 'dateCreated'])
        done();
      });

    });

    it('fails if required fields are null',function(done){
      Bucket.create({
        user: null,
        description: null,
        path: null,
        dateCreated: null,
        isPublic: null,
        data: null
      },function(err){
        err.errors.should.be.an.Object;
        Object.keys(err.errors).length.should.equal(5);
        Object.keys(err.errors).should.containDeep(['isPublic', 'path', 'description', 'user', 'dateCreated']);
        done();
      });
    });

    it('user/path combination must be unique', function (done) {
      var id = mongoose.Types.ObjectId();
      Bucket.create({
        path:'data/bla',
        description: 'sensor data',
        user: id
      },function(err,doc){
        should(err).not.be.ok;
        Bucket.create({
          path:'data/bla',
          description: 'sensor data',
          user: id
        },function(errr){
          should(errr).have.property('name', 'MongoError');
          should(errr).have.property('code', 11000);
          errr.err.should.containEql('duplicate key error');
          done();
        });
      });
    });

  });

});
