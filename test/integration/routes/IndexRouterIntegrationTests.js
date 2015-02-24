var
  request = require('supertest'),
  rewire = require("rewire"),
  should = require('should'),
  express = require('express'),
  ejs = require('ejs'),
  path = require('path'),
  app, routerMock
;

describe('playlist router path tests', function () {

  before(function(){
    app = express();
    app.set('views', path.join(__dirname + '../../../../client'));
    app.engine('.html', ejs.__express);
    app.set('view engine', 'html');
    routerMock = rewire('../../../server/routes/index');
    app.use(routerMock);
  });

  after(function(){
  });

  describe('GET / succeeds', function () {

    it('renders index', function (done) {

      request(app)
        .get('/')
        .expect('Content-Type', /html/)
        .expect(/This is api/)
        .expect(200, function (err, res) {
          if (err) return done(err);
          done();
        });

    });

  });

  describe('authentication pages rendering fails', function () {

    it('renders 404 on blank', function (done) {
      request(app)
        .get('/blank.html')
        .expect(404,done);
    });

    it('renders 404 on login', function (done) {
      request(app)
        .get('/login.html')
        .expect(404,done);
    });

    it('renders 404 on name', function (done) {
      request(app)
        .get('/name.html')
        .expect(404,done);
    });

    it('renders 404 on success', function (done) {
      request(app)
        .get('/success.html')
        .expect(404,done);
    });

  });

});
