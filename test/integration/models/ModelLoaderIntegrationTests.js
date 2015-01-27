var
  mongoose = require('mongoose'),
  datasource = require('../../../server/conf/datasource'),
  should = require('should'),
  initializer = require('../../../server/models/index')
;

describe('Schema loader integration tests', function () {

  var dbString = datasource.testDbString();

  before(function(done){
    mongoose.connect(dbString,function(){
      done();
    });
  });

  after(function(done){
    mongoose.connection.db.dropDatabase(function(){
      mongoose.disconnect(done);
    });
  });

  describe('model initialization', function () {

    it('initializes all models', function (done) {
      initializer.init();
      var models = mongoose.modelNames();
      models.length.should.eql(5);
      models.should.containDeep(['LoginAttempt', 'Role', 'User', 'UserToken', 'Bucket']);
      done();
    });

  });

});
