var
  should = require('should'),
  request = require('superagent'),
  helpers = require('../helpers')
;

describe('Bucket API', function () {

  var serverProcess;

  before(function(done){
    this.timeout(4000);
    helpers.startServer(function(process){
      serverProcess = process;
      done();
    });
  });

  after(function(done){
    helpers.stopServer(serverProcess, done);
  });

  /*
  describe('GET list', function () {

    describe('having anonymous access', function () {
      it('returns public buckets on guest path', function(done){});
      it('returns 401 on me path', function(done){});
      it('returns 401 on user path', function(done){});
      it('returns 401 on admin path', function(done){});
    });

    describe('having user access', function () {
      it('returns public buckets on guest path', function(done){});
      it('returns my buckets on me path', function(done){});
      it('returns my buckets on my user path', function(done){});
      it('returns 403 on not my user path', function(done){});
      it('returns 403 on admin path', function(done){});
    });

    describe('having admin access', function () {
      it('returns public buckets on guest path', function(done){});
      it('returns admin buckets on me path', function(done){});
      it('returns any user buckets on user path', function(done){});
      it('returns all buckets on admin path', function(done){});
    });

  });
  */

});
