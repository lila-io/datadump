var
  mongoose = require('mongoose'),
  datasource = require('../../../server/conf/datasource'),
  should = require('should'),
  User = require('../../../server/models/user')
;

describe('User schema integration tests', function () {

  var dbString = datasource.testDbString();

  before(function(done){
    mongoose.connect(dbString,function(){
      User.ensureIndexes(done);
    });
  });

  after(function(done){
    mongoose.connection.db.dropDatabase(function(){
      mongoose.disconnect(done);
    });
  });

  describe('constraints tests', function () {

    it('fails if trying to save default user instance', function (done) {
      User.create({},function(err){
        err.errors.should.be.an.Object;
        Object.keys(err.errors).length.should.equal(1);
        done();
      });
    });

    it('fails if required fields are blank',function(done){

      User.create({
        username: '',
        displayName: '',
        email: '',
        password: '',
        enabled: '',
        authorities: [],
        dateCreated: '',
        twitter: {},
        github: {},
        facebook: {},
        google: {}
      },function(err){
        err.errors.should.be.an.Object;
        Object.keys(err.errors).length.should.equal(2);
        Object.keys(err.errors).should.containDeep(['username','password'])
        done();
      });

    });

    it('fails if required fields are null',function(done){

      User.create({
        username: null,
        displayName: null,
        email: null,
        password: null,
        enabled: null,
        authorities: null,
        dateCreated: null,
        twitter: null,
        github: null,
        facebook: null,
        google: null
      },function(err){
        err.errors.should.be.an.Object;
        Object.keys(err.errors).length.should.equal(3);
        Object.keys(err.errors).should.containDeep(['username','password','enabled'])
        done();
      });

    });

    it('requires username', function (done) {
      User.create({},function(err){
        err.errors.username.type.should.equal('required');
        done();
      });
    });

    it('username must be unique', function (done) {
      User.create({username:'abc'},function(err,doc){
        should(err).not.be.ok;
        User.create({username:'abc'},function(errr){
          should(errr).have.property('name', 'MongoError');
          should(errr).have.property('code', 11000);
          errr.err.should.containEql('duplicate key error');
          done();
        });
      });
    });

  });

  describe('save hook tests', function () {

    it('hashes password before populating database', function (done) {
      User.create({
        username:'12345',
        password: '12345'
      },function(err,u){
        u.should.be.an.Object;
        u.password.should.not.eql('12345');

        User.findById(u._id,function(errrr,dbUser){
          dbUser.password.should.not.eql('12345');
          dbUser.password.should.eql(u.password);
          done();
        });

      });
    });

    it('hashes password after it changed', function (done) {
      User.create({
        username:'blabla',
        password: '12345'
      },function(err,u){

        var firstHash = u.password;
        u.password.should.not.eql('12345');
        u.password = 'new pass';

        u.save(function(errr,usr){

          usr.password.should.not.eql('12345');
          usr.password.should.not.eql('new pass');
          usr.password.should.not.eql(firstHash);

          usr.comparePassword('new pass',function(e,result){
            result.should.eql(true);
            done();
          });
        });

      });
    });


    it('does not hash password if it is the same', function (done) {

      // execution time is roughly the same as creating new user

      User.create({
        username:'blabla2',
        password: '12345'
      },function(err,u){

        var firstHash = u.password;
        u.username = 'balabla3';

        u.save(function(errr,usr){
          usr.password.should.eql(firstHash);
          done();
        });

      });
    });


  });

  describe('compare password tests', function () {

    it('fails invalid password check', function (done) {
      User.create({
        username:'123456',
        password: '12345'
      },function(err,u){
        u.should.be.an.Object;
        u.password.should.not.eql('12345');

        u.comparePassword(12345,function(e,result){
          should(result).not.be.ok;
          done();
        });

      });
    });

    it('validates password', function (done) {
      User.create({
        username:'1234567',
        password: '12345'
      },function(err,u){
        u.should.be.an.Object;
        u.password.should.not.eql('12345');

        u.comparePassword('12345',function(e,result){
          result.should.eql(true);
          done();
        });

      });
    });

  });

  describe('static method findOrCreate', function () {

    it('returns error as username is required', function (done) {
      User.findOrCreate(null,null,function(err,doc){
        err.should.eql('username is required');
        should(doc).not.be.ok;
        done();
      });
    });

    it('creates nonexistent user', function (done) {
      User.findOrCreate({username:'doesnotexist'},null,function(err,doc){
        should(err).not.be.ok;
        should(doc).be.ok;
        doc.username.should.eql('doesnotexist');
        done();
      });
    });

    it('finds existing user', function (done) {

      User.create({username:'existing'},function(err,doc){
        should(err).not.be.ok;

        User.find(function(err1,docsBefore){

          User.findOrCreate({username:'existing'},null,function(err,doc){
            should(err).not.be.ok;
            should(doc).be.ok;
            doc.username.should.eql('existing');

            User.find(function(err2,docsAfter){
              docsBefore.length.should.eql(docsAfter.length);
              done();
            })
          });
        });
      });

    });

    it('finds user and overwrites its password', function (done) {

      User.create({username:'user01',password:'123456'},function(err,userBefore){
        should(err).not.be.ok;

        User.findOrCreate({username:'user01',password:'xyz'},true,function(err,userAfter){
          should(err).not.be.ok;
          should(userAfter).be.ok;

          userBefore.password.should.not.eql(userAfter.password);

          userAfter.comparePassword('xyz',function(e,result){
            result.should.eql(true);
            done();
          });
        });
      });

    });

    it('finds user and does not overwrite its password as it it the same', function (done) {

      User.create({username:'userXX',password:'123456'},function(err,userBefore){
        should(err).not.be.ok;

        User.findOrCreate({username:'userXX',password:'123456'},true,function(err,userAfter){
          should(err).not.be.ok;
          should(userAfter).be.ok;

          userBefore.password.should.eql(userAfter.password);

          userAfter.comparePassword('123456',function(e,result){
            result.should.eql(true);
            done();
          });
        });
      });

    });

  });

});
