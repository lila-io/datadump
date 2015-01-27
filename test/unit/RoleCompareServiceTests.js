var rewire = require("rewire"),
    auth = rewire('../../server/services/RoleCompareService'),
    should = require('should');

describe('Role compare service', function(){

  describe('Argument checks',function(){
    it('requires role', function(done){
      (function(){
        auth.getDirectLowerRoles();
      }).should.throw('role is required');
      done();
    });
    it('requires role to be string', function(done){
      (function(){
        auth.getDirectLowerRoles(89709879876987);
      }).should.throw('role is required');
      done();
    });
  });

  describe('Configuration check',function(){
    it('misconfiguration throws error', function(done){
      auth.__set__('roleConfig','wrong');
      (function(){
        auth.getDirectLowerRoles('test');
      }).should.throw('role config requires array');
      done();
    });
    it('if no roles in config then empty array is returned', function(done){
      auth.__set__({roleConfig:[]});
      var resp = auth.getDirectLowerRoles('test');
      resp.should.be.an.instanceOf(Array);
      resp.length.should.equal(0);
      done();
    });
  });

  describe('First level roles',function(){
    it('no match returns empty array', function(done){
      auth.__set__('roleConfig',[ 'ROLE_SUPERADMIN > ROLE_ADMIN', 'ROLE_ADMIN > ROLE_USER', 'ROLE_ADMIN > ROLE_API']);
      var resp = auth.getDirectLowerRoles('ROLE_USER')
      resp.should.be.an.instanceOf(Array);
      resp.length.should.equal(0);
      done();
    });
    it('has one lower role', function(done){
      auth.__set__('roleConfig',[ 'ROLE_SUPERADMIN > ROLE_ADMIN', 'ROLE_ADMIN > ROLE_USER', 'ROLE_ADMIN > ROLE_API']);
      var resp = auth.getDirectLowerRoles('ROLE_SUPERADMIN')
      resp.length.should.equal(1);
      resp.should.eql(['ROLE_ADMIN']);
      done();
    });
    it('admin has two lower roles', function(done){
      auth.__set__('roleConfig',[ 'ROLE_SUPERADMIN > ROLE_ADMIN', 'ROLE_ADMIN > ROLE_USER', 'ROLE_ADMIN > ROLE_API']);
      var resp = auth.getDirectLowerRoles('ROLE_ADMIN')
      resp.length.should.equal(2);
      resp.should.eql(['ROLE_USER','ROLE_API']);
      done();
    });
  });

  describe('Lower roles up to third level',function(){
    it(' has one direct, two second and one third level roles',function(done){
      auth.__set__('roleConfig',[ 'ROLE_SUPERADMIN > ROLE_ADMIN', 'ROLE_ADMIN > ROLE_USER', 'ROLE_ADMIN > ROLE_API', 'ROLE_API > ROLE_TINY_API']);
      var resp = auth.getLowerRoles('ROLE_SUPERADMIN')
      resp.length.should.equal(4);
      resp.should.eql(['ROLE_ADMIN','ROLE_USER','ROLE_API','ROLE_TINY_API']);
      done();
    });
  });

  describe('Role diff',function(){
    it('throws error if no arr passed',function(done){
      (function(){
        auth.diff()
      }).should.throw('two arrays required');
      done();
    });
    it('should return difference array',function(done){
      var rls1 = ['bla','bla','Bla','La','lbla','la','bla','La'],
          rls2 = ['bla','Bla','La','lbla'];
      auth.diff(rls1,rls2).should.eql(['la']);
      auth.diff(rls2,rls1).should.eql([]);
      done();
    });
  });

  describe('Unique roles',function(){
    it('throws error if no arr passed',function(done){
      (function(){
        auth.uniqueRoles()
      }).should.throw('array of roles required');
      done();
    });
    it('should return unique set of results',function(done){
      var rls = ['bla','bla','Bla','La','lbla','la','bla','La'];
      auth.uniqueRoles(rls).should.eql(['bla','Bla','La','lbla','la']);
      done();
    });
  });

})
