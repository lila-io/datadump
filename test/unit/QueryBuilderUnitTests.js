var should = require('should');
var builder = require('../../server/models/queryBuilder');

describe('QueryBuilder unit tests', function(){

  it('QueryBuilder is an instance', function(done){
    builder.QueryBuilder.should.have.property('isInstance').which.eql(false);
    builder.QueryBuilder.should.have.instanceof(builder.QueryBuilder.constructor);
    done();
  });

  it('QueryBuilder builds new instance', function(done){
    var instance = builder.QueryBuilder.instance();
    instance.should.have.property('isInstance').which.eql(true);
    instance.should.have.instanceOf(builder.QueryBuilder.constructor);
    done();
  });

});
