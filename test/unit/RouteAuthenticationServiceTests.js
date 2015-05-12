var rewire = require("rewire")
	, should = require('should')
	, auth = rewire('../../server/services/RouteAuthenticationService');

describe('Route Authentication service tests', function(){

	describe('require role method',function(){

		it('throws error if no ROLE is passed', function(done){
			(function(){
				auth.require();
			}).should.throw('ROLE is required');
			done();
		});

    it('request method OPTIONS succeeds', function(done){

      var status,
          req = { method: 'OPTIONS', isAuthenticated:function(){return false} },
          res = { status: function(n){ status = n; return res; }, end: function(){}},
          next = function(){};

      should.not.exist( auth.require('BLA')(req,res,next) );
      status.should.eql( 200 );
      done();
    });


		it('Fails if request is not authenticated and passport authentication returns error', function(done){
			var status,
				req = {
          method: 'GET',
          _passport: {
            instance: {
              authenticate: function(type,options,cb){
                return function(request,response){
                  cb('error');
                }
              }
            }
          }
				}, res = {
            status: function(n){ status = n; return res; },
            end: function(){}
				}, next = function(){};

			should.not.exist( auth.require('some_role')(req,res,next) );
      status.should.eql( 401 );
      done();
		});

    it('Fails if request is not authenticated and passport does not authenticate user', function(done){
      var status,
          req = {
            method: 'GET',
            _passport: {
              instance: {
                authenticate: function(type,options,cb){
                  return function(request,response){
                    cb(null,null);
                  }
                }
              }
            }
          }, res = {
            status: function(n){ status = n; return res; },
            end: function(){}
          }, next = function(){};

      should.not.exist( auth.require('some_role')(req,res,next) );
      status.should.eql( 401 );
      done();
    });

    it('continues if role is anonymous, request is not authenticated and passport does not authenticate user', function(done){
      var status,
          nextWasCalled = false,
          req = {
            method: 'GET',
            _passport: {
              instance: {
                authenticate: function(type,options,cb){
                  return function(request,response){
                    cb(null,null);
                  }
                }
              }
            }
          }, res = {
            status: function(n){ status = n; return res; },
            end: function(){}
          }, next = function(){ nextWasCalled = true; };

      should.not.exist( auth.require('permitAll')(req,res,next) );
      nextWasCalled.should.eql( true );

      nextWasCalled = false;

      should.not.exist( auth.require('IS_AUTHENTICATED_ANONYMOUSLY')(req,res,next) );
      nextWasCalled.should.eql( true );

      done();
    });

		it('fails with 403 if user has no roles', function(done){

      var status,
          nextWasCalled = false,
          req = {
            method: 'GET',
            _passport: {
              instance: {
                authenticate: function(type,options,cb){
                  return function(request,response){
                    cb(null, { authorities : [] } );
                  }
                }
              }
            }
          },
          res = {
            status: function(n){ status = n; return res; },
            end: function(){}
          },
          next = function(){ nextWasCalled = true; };

      should.not.exist( auth.require('SOME_ROLE')(req,res,next) );
      nextWasCalled.should.eql( false );
      status.should.eql( 403 );
      done();

		});

		it('Fails if user is set in request and has no roles', function(done){
			var status,
          nextWasCalled = false,
				req = {
					user : { authorities : [] }
				},
        res = {
          status: function(n){ status = n; return res; },
          end: function(){}
        },
        next = function(){ nextWasCalled = true; };

			should.not.exist( auth.require('some_role')(req,res,next) );

      nextWasCalled.should.eql( false );
      status.should.eql( 403 );
			done();
		});

		it('logs in user and calls next() if role matches', function(done){
      var status,
          nextWasCalled = false,
          req = {
            user : { authorities : ['matching_role'] }
          },
          res = {
            status: function(n){ status = n; return res; },
            end: function(){}
          },
          next = function(){ nextWasCalled = true; };

      should.not.exist( auth.require('matching_role')(req,res,next) );
      nextWasCalled.should.eql( true );
      done();

		});


    it('calls next for anonymous requirement if request is authenticated and user has roles', function(done){
      var status,
          nextWasCalled = false,
          req = {
            user : { authorities : ['bla'] }
          },
          res = {
            status: function(n){ status = n; return res; },
            end: function(){}
          },
          next = function(){ nextWasCalled = true; };

      should.not.exist( auth.require('permitAll')(req,res,next) );
      nextWasCalled.should.eql( true );
      done();

    });


		it('Fails if there are no roles in role hierarchy', function(done){
      var status,
          nextWasCalled = false,
          req = {
            user : { authorities : ['bla'] }
          },
          res = {
            status: function(n){ status = n; return res; },
            end: function(){}
          },
          next = function(){ nextWasCalled = true; };

			auth.__set__("roleCompareService", {
				getLowerRoles : function(role){
          role.should.eql( 'bla' );
					return [];
				}
			});

			should.not.exist( auth.require('some_role')(req,res,next) );
      nextWasCalled.should.eql( false );
      status.should.eql( 403 );
			done();

		});

		it('fails if there are no matching roles in role hierarchy', function(done){
      var status,
          nextWasCalled = false,
          req = {
            user : { authorities : ['bla'] }
          },
          res = {
            status: function(n){ status = n; return res; },
            end: function(){}
          },
          next = function(){ nextWasCalled = true; };

			auth.__set__("roleCompareService", {
				getLowerRoles : function(role){
          role.should.eql( 'bla' );
					return ['not_matching_child_role','another_not_matching_role'];
				}
			});

      should.not.exist( auth.require('some_role')(req,res,next) );
      nextWasCalled.should.eql( false );
      status.should.eql( 403 );
			done();
		});

		it('calls next() if role matches one in role hierarchy tree', function(done){
      var status,
          nextWasCalled = false,
          req = {
            user : { authorities : ['x','y','z'] }
          },
          res = {
            status: function(n){ status = n; return res; },
            end: function(){}
          },
          next = function(){ nextWasCalled = true; };
			auth.__set__("roleCompareService", {
				getLowerRoles : function(role){
					if(role === 'z')return ['matching_role'];
					return ['not_matching_role'];
				}
			});

      should.not.exist( auth.require('matching_role')(req,res,next) );
      nextWasCalled.should.eql( true );
      done();
		});
	});

});
