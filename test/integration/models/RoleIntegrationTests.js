var
  mongoose = require('mongoose'),
  datasource = require('../../../server/conf/datasource'),
  should = require('should'),
  Role = require('../../../server/models/role')
;

describe('Role schema integration tests', function () {

  var dbString = datasource.testDbString();

  before(function(done){
    mongoose.connect(dbString,function(){
      Role.ensureIndexes(done);
    });
  });

  after(function(done){
    mongoose.connection.db.dropDatabase(function(){
      mongoose.disconnect(done);
    });
  });

  describe('constraints tests', function () {

    it('requires authority string', function (done) {
      Role.create({},function(err){
        err.errors.authority.type.should.equal('required');
        done();
      });
    });

    it('must be unique', function (done) {
      Role.create({authority:'abc'},function(err,doc){
        should(err).not.be.ok;
        Role.create({authority:'abc'},function(errr){
          should(errr).have.property('name', 'MongoError');
          should(errr).have.property('code', 11000);
          errr.err.should.containEql('duplicate key error');
          done();
        });
      });
    });

  });

  describe('static method findOrCreate', function () {

    it('returns error as authority cannot be null', function (done) {
      Role.findOrCreate(null,function(err,role){
        should(err).have.property('name', 'ValidationError');
        should(err).have.property('message', 'Validation failed');
        should(err.errors.authority).have.property('path', 'authority');
        should(err.errors.authority).have.property('type', 'required');
        should(err.errors.authority).have.property('value', null);
        done();
      });
    });

    it('creates nonexistent role', function (done) {
      Role.findOrCreate('doesnotexist',function(err,role){
        should(err).not.be.ok;
        should(role).be.ok;
        role.authority.should.eql('doesnotexist');
        done();
      });
    });

    it('finds existing role', function (done) {

      Role.create({authority:'existing'},function(err,doc){
        should(err).not.be.ok;

        Role.find(function(err1,rolesBefore){

          Role.findOrCreate('existing',function(err,role){
            should(err).not.be.ok;
            should(role).be.ok;
            role.authority.should.eql('existing');

            Role.find(function(err2,rolesAfter){
              rolesBefore.length.should.eql(rolesAfter.length);
              done();
            })
          });
        });
      });

    });

  });

});
