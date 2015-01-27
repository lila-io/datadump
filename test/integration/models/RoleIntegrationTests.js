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

    it('requires must be unique', function (done) {
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

});
