var
  should = require('should'),
	service = require('../../server/services/TokenService'),
  _ = require('underscore'),
  async = require('async')
  ;

describe('Token service tests', function(){

  it('throws error if no id is passed', function(done){
    (function(){
      service.generateToken();
    }).should.throw('Illegal arguments, must be: id, fn.');
    done();
  });

  it('generates token for number value', function(done){
    service.generateToken(123,function(token){
      token.should.be.ok;
      token.should.be.type('string');
      done();
    });
  });

  it('generates token for string value', function(done){
    service.generateToken('123',function(token){
      token.should.be.ok;
      token.should.be.type('string');
      done();
    });
  });

  it('generates token for object value', function(done){
    service.generateToken({ho:'hey'},function(token){
      token.should.be.ok;
      token.should.be.type('string');
      done();
    });
  });

  it('generates token for array value', function(done){
    service.generateToken(['a','b','c'],function(token){
      token.should.be.ok;
      token.should.be.type('string');
      done();
    });
  });

  it('generates token for boolean value', function(done){
    service.generateToken(false,function(token){
      token.should.be.ok;
      token.should.be.type('string');
      done();
    });
  });

  it('every time generates different token for the same value', function(done){

    var createToken = function(cb) {
      service.generateToken('1', function(token){
        cb(null,token);

      });
    };

    var operationCount = 100;
    var tasks = [];
    for(var i = 0; i < operationCount; i++){
      tasks.push(createToken);
    }

    async.parallel(tasks, function(rrr, collectedTokens){
      collectedTokens.length.should.eql(operationCount);
      var unique = _.unique(collectedTokens,false);
      unique.length.should.eql(operationCount);
      done();
    });
  });

});
