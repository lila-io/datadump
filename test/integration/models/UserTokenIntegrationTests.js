var
  mongoose = require('mongoose'),
  datasource = require('../../../server/conf/datasource'),
  should = require('should'),
  UserToken = require('../../../server/models/userToken')
;

describe('UserToken schema integration tests', function () {

  var dbString = datasource.testDbString();

  before(function(done){
    mongoose.connect(dbString,function(){
      UserToken.ensureIndexes(done);
    });
  });

  after(function(done){
    mongoose.connection.db.dropDatabase(function(){
      mongoose.disconnect(done);
    });
  });

  describe('constraints tests', function () {

    it('fails if trying to save default user instance', function (done) {
      UserToken.create({},function(err){
        err.errors.should.be.an.Object;
        Object.keys(err.errors).length.should.equal(2);
        done();
      });
    });

    it('fails if required fields are blank',function(done){

      UserToken.create({
        userId: '',
        token: '',
        dateCreated: ''
      },function(err){
        err.errors.should.be.an.Object;
        Object.keys(err.errors).length.should.equal(3);
        Object.keys(err.errors).should.containDeep(['userId','token','dateCreated'])
        done();
      });

    });

    it('fails if required fields are null',function(done){

      UserToken.create({
        userId: null,
        token: null,
        dateCreated: null
      },function(err){
        err.errors.should.be.an.Object;
        Object.keys(err.errors).length.should.equal(3);
        Object.keys(err.errors).should.containDeep(['userId','token','dateCreated'])
        done();
      });

    });

    it('token must be unique', function (done) {
      var id = mongoose.Types.ObjectId();
      UserToken.create({userId: id, token:'1234'},function(err,doc){
        should(err).not.be.ok;
        UserToken.create({userId: id, token:'1234'},function(errr){
          should(errr).have.property('name', 'MongoError');
          should(errr).have.property('code', 11000);
          errr.err.should.containEql('duplicate key error');
          done();
        });
      });
    });

  });

});
