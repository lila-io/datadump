var
  rewire = require("rewire"),
  router = rewire('../../server/routes/bucket'),
  should = require('should')
  ;

describe('bucket router helper method', function () {

  describe('buildSearchOptions()', function () {

    var testFn = router.__get__('buildSearchOptions');

    it('returns cleaned request query', function (done) {
      var q = '<meta%20http-equiv="refresh"%20content="0;">';
      var cleaned = ' meta 20http equiv refresh 20content 0 ';
      testFn({ resourceOwner:{_id:123}, query: {query:q} }).query.should.eql(cleaned);
      done();
    });

    it('recognizes isPublic parameter', function (done) {
      testFn({ user:{_id:123, isAdmin:true}, resourceOwner:{_id:123}, query: {isPublic:'false'} }).isPublic.should.equal(false);
      done();
    });

    it('recognizes isPublic parameter but overrites it as path is guest', function (done) {
      testFn({ resourceOwnerType: 'guest', resourceOwner:{_id:123}, query: {isPublic:'false'} }).isPublic.should.equal(true);
      done();
    });

  });

  describe('buildPositionalOptions()', function () {

    var testFn = router.__get__('buildPositionalOptions');

    it('returns defaults', function (done) {
      var resp = testFn();
      resp.max.should.equal(10);
      resp.offset.should.equal(0);
      resp.sort.should.equal('dateCreated');
      resp.order.should.equal('desc');
      done();
    });

    it('fails to parse max and offset and falls back to defaults', function (done) {
      var resp = testFn({query:{max:false,offset:true}});
      resp.max.should.equal(10);
      resp.offset.should.equal(0);
      done();
    });

    it('does not allow max to exceed 100', function (done) {
      var resp = testFn({query:{max:'1000'}});
      resp.max.should.equal(100);
      done();
    });

    it('parses new offset', function (done) {
      var resp = testFn({query:{offset:'1000'}});
      resp.offset.should.equal(1000);
      done();
    });

    it('accepts new sort and order', function (done) {
      var resp = testFn({query:{sort:'x',order:'asc'}});
      resp.sort.should.equal('x');
      resp.order.should.equal('asc');
      done();
    });

  });

});
