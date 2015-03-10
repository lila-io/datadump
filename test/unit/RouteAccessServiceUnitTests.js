var
  service = require('../../server/services/RouteAccessService'),
  should = require('should')
  ;


describe('bucket router helper method', function () {

  describe('isAnonymous()', function () {

    it('returns true if no arguments', function (done) {
      service.isAnonymous().should.eql(true);
      done();
    });

    it('returns true user has no id', function (done) {
      service.isAnonymous({}).should.eql(true);
      done();
    });

    it('returns true user has falsy id', function (done) {
      service.isAnonymous({_id:''}).should.eql(true);
      done();
    });

    it('returns false if user has id', function (done) {
      service.isAnonymous({_id:'765s6dsd5s67d'}).should.eql(false);
      done();
    });

  });

  describe('isUser()', function () {

    it('returns false if no arguments', function (done) {
      service.isUser().should.eql(false);
      done();
    });

    it('returns false user has no id', function (done) {
      service.isUser({}).should.eql(false);
      done();
    });

    it('returns false user has falsy id', function (done) {
      service.isUser({_id:''}).should.eql(false);
      done();
    });

    it('returns true if user has id', function (done) {
      service.isUser({_id:'765s6dsd5s67d'}).should.eql(true);
      done();
    });

  });

  describe('isAdmin()', function () {

    it('returns false if no arguments', function (done) {
      service.isAdmin().should.eql(false);
      done();
    });

    it('returns false user has no id', function (done) {
      service.isAdmin({}).should.eql(false);
      done();
    });

    it('returns false user has falsy id', function (done) {
      service.isAdmin({_id:''}).should.eql(false);
      done();
    });

    it('returns false if is not admin', function (done) {
      service.isAdmin({_id:'765s6dsd5s67d'}).should.eql(false);
      done();
    });

    it('returns true if is admin', function (done) {
      service.isAdmin({_id:'765s6dsd5s67d',isAdmin:true}).should.eql(true);
      done();
    });

  });

  describe('isSelf()', function () {

    it('returns false if no arguments', function (done) {
      service.isSelf().should.eql(false);
      done();
    });

    it('returns false if both are empty', function (done) {
      service.isSelf({},{}).should.eql(false);
      done();
    });

    it('returns false if bucket has no user', function (done) {
      service.isSelf({_id:123},{}).should.eql(false);
      done();
    });

    it('returns false if ids do not match', function (done) {
      service.isSelf({_id:123},{user:{_id:999}}).should.eql(false);
      done();
    });

    it('returns true if ids match', function (done) {
      service.isSelf({_id:123},{user:{_id:123}}).should.eql(true);
      done();
    });

    it('returns true if ids match when resource user is just id', function (done) {
      service.isSelf({_id:123},{user:123}).should.eql(true);
      done();
    });

    it('returns true after ids are coerced into strings', function (done) {
      service.isSelf({_id:'123'},{user:123}).should.eql(true);
      done();
    });

  });

  describe('isOwnPath()', function () {

    it('returns false if no arguments', function (done) {
      service.isOwnPath().should.eql(false);
      done();
    });

    it('returns false if both are empty', function (done) {
      service.isOwnPath({},{}).should.eql(false);
      done();
    });

    it('returns false if ids do not match', function (done) {
      service.isOwnPath({_id:123},{_id:321}).should.eql(false);
      done();
    });

    it('returns true if ids match', function (done) {
      service.isOwnPath({_id:123},{_id:123}).should.eql(true);
      done();
    });

  });

  describe('hasPathAccess()', function () {

    it('returns false if no arguments', function (done) {
      service.hasPathAccess().should.eql(false);
      done();
    });

    it('returns false if both are empty', function (done) {
      service.hasPathAccess({},{}).should.eql(false);
      done();
    });

    it('returns false if ids do not match', function (done) {
      service.hasPathAccess({_id:123},{_id:321}).should.eql(false);
      done();
    });

    it('returns true if ids match', function (done) {
      service.hasPathAccess({_id:123},{_id:123}).should.eql(true);
      done();
    });

    it('returns true if authenticated user is admin', function (done) {
      service.hasPathAccess({_id:444,isAdmin:true},{_id:222}).should.eql(true);
      done();
    });

  });

  describe('isResourceHidden()', function () {

    it('hides if no arguments', function (done) {
      service.isResourceHidden().should.eql(true);
      done();
    });

    it('hides if no bucket', function (done) {
      service.isResourceHidden({_id:123},'me',null).should.eql(true);
      done();
    });

    it('always shows public bucket', function (done) {
      service.isResourceHidden({_id:123},'me',{isPublic:true,user:321}).should.eql(false);
      done();
    });

    it('hides private bucket on guest path', function (done) {
      service.isResourceHidden({_id:123},'guest',{isPublic:false, user:123}).should.eql(true);
      done();
    });

    it('hides private bucket on guest path for admin', function (done) {
      service.isResourceHidden({_id:123, isAdmin:true},'guest',{isPublic:false}).should.eql(true);
      done();
    });

    it('hides private bucket on me path when user is not the owner', function (done) {
      service.isResourceHidden({_id:123},'me',{isPublic:false, user:321}).should.eql(true);
      done();
    });

    it('shows private bucket on me path when user is the owner', function (done) {
      service.isResourceHidden({_id:123},'me',{isPublic:false, user:123}).should.eql(false);
      done();
    });

    it('hides private bucket on me path when admin is not the owner', function (done) {
      service.isResourceHidden({_id:123, isAdmin:true},'me',{isPublic:false, user:321}).should.eql(true);
      done();
    });

    it('shows private bucket on me path when admin is the owner', function (done) {
      service.isResourceHidden({_id:123, isAdmin:true},'me',{isPublic:false, user:123}).should.eql(false);
      done();
    });

    it('shows private bucket on user path', function (done) {
      service.isResourceHidden({_id:123},'user',{isPublic:false,user:321}).should.eql(false);
      done();
    });

    it('shows private bucket on admin path', function (done) {
      service.isResourceHidden({_id:123},'admin',{isPublic:false,user:321}).should.eql(false);
      done();
    });

    it('shows private bucket on other paths', function (done) {
      service.isResourceHidden({_id:123},'anyOtherPathType',{isPublic:false,user:321}).should.eql(false);
      done();
    });

  });

  describe('hasAccess()', function () {

    it('NO if no arguments', function (done) {
      service.hasAccess().should.eql(false);
      done();
    });

    it('NO if arguments are empty', function (done) {
      service.hasAccess({},'',{}).should.eql(false);
      done();
    });

    it('YES for public bucket', function (done) {
      service.hasAccess({},'',{isPublic:true}).should.eql(true);
      done();
    });

    it('YES for admin', function (done) {
      service.hasAccess({_id:123,isAdmin:true},'',{isPublic:false}).should.eql(true);
      done();
    });

    it('NO when path access type is not set', function (done) {
      service.hasAccess({_id:123},'',{isPublic:false}).should.eql(false);
      done();
    });

    it('NO when user is not the owner', function (done) {
      service.hasAccess({_id:123},'guest',{isPublic:false,user:{_id:321}}).should.eql(false);
      service.hasAccess({_id:123},'me',{isPublic:false,user:{_id:321}}).should.eql(false);
      service.hasAccess({_id:123},'user',{isPublic:false,user:{_id:321}}).should.eql(false);
      service.hasAccess({_id:123},'admin',{isPublic:false,user:{_id:321}}).should.eql(false);
      service.hasAccess({_id:123},'anyOther',{isPublic:false,user:{_id:321}}).should.eql(false);
      done();
    });

    it('NO when owner on guest path', function (done) {
      service.hasAccess({_id:123},'guest',{isPublic:false,user:{_id:123}}).should.eql(false);
      done();
    });

    it('NO when owner on admin path', function (done) {
      service.hasAccess({_id:123},'admin',{isPublic:false,user:{_id:123}}).should.eql(false);
      done();
    });

    it('NO when owner on unrecognized path', function (done) {
      service.hasAccess({_id:123},'unrecognized',{isPublic:false,user:{_id:123}}).should.eql(false);
      done();
    });

    it('YES when owner on me path', function (done) {
      service.hasAccess({_id:123},'me',{isPublic:false,user:{_id:123}}).should.eql(true);
      done();
    });

    it('YES when owner on user id path', function (done) {
      service.hasAccess({_id:123},'user',{isPublic:false,user:{_id:123}}).should.eql(true);
      done();
    });

  });

  describe('resourceOwnerId()', function () {

    it('throws if no arguments', function (done) {
      (function(){ service.resourceOwnerId() }).should.throw(/resource owner is set before/);
      done();
    });

    it('throws for anonymous', function (done) {
      (function(){ service.resourceOwnerId({resourceOwner:{}}) }).should.throw(/resource owner is set before/);
      done();
    });

    it('returns id', function (done) {
      service.resourceOwnerId({resourceOwner:{_id:123}}).should.equal(123);
      done();
    });

  });

  describe('hasAccessToList()', function () {

    it('returns false if user is anonymous and path is not guest', function (done) {
      (service.hasAccessToList({}) === false).should.be.true;
      done();
    });

    it('returns true if user is anonymous and path is guest', function (done) {
      (service.hasAccessToList({resourceOwnerType:'guest'}) === true).should.be.true;
      done();
    });

    it('returns false for user on admin path', function (done) {
      (service.hasAccessToList({user:{_id:123},resourceOwnerType:'admin'}) === false).should.be.true;
      done();
    });

    it('returns true for admin on admin path', function (done) {
      (service.hasAccessToList({user:{_id:123,isAdmin:true},resourceOwnerType:'admin'}) === true).should.be.true;
      done();
    });

    it('returns true for user on other user path', function (done) {
      (service.hasAccessToList({user:{_id:123},resourceOwnerType:'user'}) === true).should.be.true;
      done();
    });

    it('returns true for user on guest path', function (done) {
      (service.hasAccessToList({user:{_id:123},resourceOwnerType:'guest'}) === true).should.be.true;
      done();
    });

    it('returns true for user on own user path', function (done) {
      (service.hasAccessToList({user:{_id:123},resourceOwner:{_id:123},resourceOwnerType:'user'}) === true).should.be.true;
      done();
    });

    it('returns true for user on own path', function (done) {
      (service.hasAccessToList({user:{_id:123},resourceOwner:{_id:123},resourceOwnerType:'me'}) === true).should.be.true;
      done();
    });

  });


  describe('requiresPublicList()', function () {

    it('YES if no data in request', function (done) {
      (service.requiresPublicList({}) === true).should.be.true;
      done();
    });

    it('YES if user on admin path', function (done) {
      (service.requiresPublicList({user:{_id:123},resourceOwnerType:'admin'}) === true).should.be.true;
      done();
    });

    it('YES if anonymous on guest path', function (done) {
      (service.requiresPublicList({resourceOwnerType:'guest'}) === true).should.be.true;
      done();
    });

    it('YES if user on guest path', function (done) {
      (service.requiresPublicList({user:{_id:123},resourceOwnerType:'guest'}) === true).should.be.true;
      done();
    });

    it('YES if admin on guest path', function (done) {
      (service.requiresPublicList({user:{_id:123,isAdmin:true},resourceOwnerType:'guest'}) === true).should.be.true;
      done();
    });


    it('YES if anonymous on user path', function (done) {
      (service.requiresPublicList({resourceOwnerType:'user'}) === true).should.be.true;
      done();
    });

    it('NO if user on own user id path', function (done) {
      (service.requiresPublicList({user:{_id:123},resourceOwnerType:'user',resourceOwner:{_id:123}}) === false).should.be.true;
      done();
    });

    it('YES if user on other user id path', function (done) {
      (service.requiresPublicList({user:{_id:123},resourceOwnerType:'user',resourceOwner:{_id:321}}) === true).should.be.true;
      done();
    });

    it('NO if admin on user path', function (done) {
      (service.requiresPublicList({user:{_id:123,isAdmin:true},resourceOwnerType:'user'}) === false).should.be.true;
      done();
    });

    it('YES if anonymous on admin path', function (done) {
      (service.requiresPublicList({resourceOwnerType:'admin'}) === true).should.be.true;
      done();
    });

    it('YES if user on admin path', function (done) {
      (service.requiresPublicList({user:{_id:123},resourceOwnerType:'admin'}) === true).should.be.true;
      done();
    });

    it('NO if admin user', function (done) {
      (service.requiresPublicList({user:{_id:123,isAdmin:true}}) === false).should.be.true;
      done();
    });

  });

  describe('requiresResourceOwnerIdForOne()', function () {

    it('YES for request without data', function (done) {
      (service.requiresResourceOwnerIdForOne({}) === true).should.be.true;
      done();
    });

    it('NO for admin', function (done) {
      (service.requiresResourceOwnerIdForOne({user:{_id:123,isAdmin:true}}) === false).should.be.true;
      done();
    });

    it('YES for me path', function (done) {
      (service.requiresResourceOwnerIdForOne({resourceOwnerType:'me'}) === true).should.be.true;
      done();
    });

    it('YES for user path', function (done) {
      (service.requiresResourceOwnerIdForOne({resourceOwnerType:'user'}) === true).should.be.true;
      done();
    });

    it('NO for guest path', function (done) {
      (service.requiresResourceOwnerIdForOne({resourceOwnerType:'guest'}) === false).should.be.true;
      done();
    });

    it('NO for admin path', function (done) {
      (service.requiresResourceOwnerIdForOne({resourceOwnerType:'admin'}) === false).should.be.true;
      done();
    });

  });

  describe('requiresResourceOwnerIdForList()', function () {

    it('YES for request without data', function (done) {
      (service.requiresResourceOwnerIdForList({}) === true).should.be.true;
      done();
    });

    it('YES for me path', function (done) {
      (service.requiresResourceOwnerIdForList({resourceOwnerType:'me'}) === true).should.be.true;
      done();
    });

    it('YES for user path', function (done) {
      (service.requiresResourceOwnerIdForList({resourceOwnerType:'user'}) === true).should.be.true;
      done();
    });

    it('NO for guest path', function (done) {
      (service.requiresResourceOwnerIdForList({resourceOwnerType:'guest'}) === false).should.be.true;
      done();
    });

    it('NO for admin path', function (done) {
      (service.requiresResourceOwnerIdForList({resourceOwnerType:'admin'}) === false).should.be.true;
      done();
    });

  });

  describe('canAccessModifyResourcePath()', function () {

    it('returns false for anonymous', function (done) {
      (service.canAccessModifyResourcePath({}) === false).should.be.true;
      done();
    });

    it('returns false for user on guest path that is not owner', function (done) {
      (service.canAccessModifyResourcePath({user:{_id:123},resourceOwnerType: 'guest', resourceOwner:{_id:999}}) === false).should.be.true;
      done();
    });

    it('returns true for user on guest path that is owner', function (done) {
      (service.canAccessModifyResourcePath({user:{_id:123},resourceOwnerType: 'guest', resourceOwner:{_id:123}}) === true).should.be.true;
      done();
    });

    it('returns false for user on me path that is not owner', function (done) {
      (service.canAccessModifyResourcePath({user:{_id:123},resourceOwnerType: 'me', resourceOwner:{_id:999}}) === false).should.be.true;
      done();
    });

    it('returns true for user on me path that is owner', function (done) {
      (service.canAccessModifyResourcePath({user:{_id:123},resourceOwnerType: 'me', resourceOwner:{_id:123}}) === true).should.be.true;
      done();
    });

    it('returns false for user on admin path', function (done) {
      (service.canAccessModifyResourcePath({user:{_id:123},resourceOwnerType: 'admin', resourceOwner:{_id:999}}) === false).should.be.true;
      (service.canAccessModifyResourcePath({user:{_id:123},resourceOwnerType: 'admin', resourceOwner:{_id:123}}) === false).should.be.true;
      done();
    });

    it('returns false for user on user path that is not owner', function (done) {
      (service.canAccessModifyResourcePath({user:{_id:123},resourceOwnerType: 'user', resourceOwner:{_id:999}}) === false).should.be.true;
      done();
    });

    it('returns true for user on user path that is owner', function (done) {
      (service.canAccessModifyResourcePath({user:{_id:123},resourceOwnerType: 'user', resourceOwner:{_id:123}}) === true).should.be.true;
      done();
    });

    it('returns true for admin', function (done) {
      (service.canAccessModifyResourcePath({user:{_id:123, isAdmin:true},resourceOwnerType: 'guest', resourceOwner:{_id:888}}) === true).should.be.true;
      (service.canAccessModifyResourcePath({user:{_id:123, isAdmin:true},resourceOwnerType: 'me', resourceOwner:{_id:888}}) === true).should.be.true;
      (service.canAccessModifyResourcePath({user:{_id:123, isAdmin:true},resourceOwnerType: 'user', resourceOwner:{_id:888}}) === true).should.be.true;
      (service.canAccessModifyResourcePath({user:{_id:123, isAdmin:true},resourceOwnerType: 'admin', resourceOwner:{_id:888}}) === true).should.be.true;
      done();
    });

  });

  describe('canModifyResource()', function () {

    it('returns true if admin', function (done) {
      (service.canModifyResource({user:{_id:123,isAdmin:true}}) === true).should.be.true;
      done();
    });

    it('returns true if owner of resource', function (done) {
      (service.canModifyResource({user:{_id:123}},{user:{_id:123}}) === true).should.be.true;
      done();
    });

    it('returns false if no user', function (done) {
      (service.canModifyResource() === false).should.be.true;
      done();
    });

    it('returns false if user is not owner', function (done) {
      (service.canModifyResource({user:{_id:123}},{user:{_id:444}}) === false).should.be.true;
      done();
    });

  });

});
