var
  mongoose = require('mongoose'),
  datasource = require('../../../server/conf/datasource'),
  should = require('should'),
  LoginAttempt = require('../../../server/models/loginAttempt')
;

describe('LoginAttempt schema integration tests', function () {

  var dbString = datasource.testDbString();

  before(function(done){
    mongoose.connect(dbString,function(){
      LoginAttempt.ensureIndexes(done);
    });
  });

  after(function(done){
    mongoose.connection.db.dropDatabase(function(){
      mongoose.disconnect(done);
    });
  });

  describe('constraints tests', function () {

    it('constraints do not apply', function (done) {
      LoginAttempt.create({},function(err,doc){
        should(err).not.be.ok;
        doc.should.be.an.Object;
        done();
      });
    });

  });

});
