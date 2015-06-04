var should = require('should');
var builder = require('../../server/models/queryBuilder');

describe('QueryBuilder unit tests', function(){

  describe('QueryBuilder', function(){
    it('in exports is an object', function(done){
      builder.QueryBuilder.should.be.an.instanceOf(Object);
      builder.QueryBuilder.should.have.property('instance');
      builder.QueryBuilder.should.have.property('constructor');
      done();
    });

    it('builds new instance', function(done){
      var instance = builder.QueryBuilder.instance();
      instance.should.have.property('column_family');
      instance.should.have.property('match');
      instance.should.have.property('values');
      instance.should.have.instanceOf(builder.QueryBuilder.constructor);
      done();
    });

    it('instance has instance method', function(done){
      var instance = builder.QueryBuilder.instance();
      var instanceOther = instance.instance();
      instance.should.not.be.exactly(instanceOther);
      instance.should.have.instanceOf(builder.QueryBuilder.constructor);
      instanceOther.should.have.instanceOf(builder.QueryBuilder.constructor);
      done();
    });

    it('instance can set column family', function(done){
      var instance = builder.QueryBuilder.instance();
      instance.should.have.property('column_family', null);
      instance.setColumnFamily('bla');
      instance.should.have.property('column_family', 'bla');
      done();
    });

    it('instance can set match query part', function(done){
      var instance = builder.QueryBuilder.instance();
      instance.should.have.property('match');
      instance.match.should.have.keys(['and$', 'in$']);
      Object.keys(instance.match).should.have.lengthOf(2);

      instance.setMatch({});
      instance.match.should.have.property('and$', {});
      instance.match.should.have.property('in$', {});

      instance.setMatch({and$:{bla:'bla'}});
      instance.match.should.have.property('and$', {bla:'bla'});
      instance.match.should.have.property('in$', {});

      done();
    });

    it('instance can set values', function(done){
      var instance = builder.QueryBuilder.instance();
      instance.should.have.property('values',{});
      instance.setValues({one:'two'});
      instance.should.have.property('values',{one:'two'});
      done();
    });

    it('has helper to build part of query where key equals value', function(done){
      var instance = builder.QueryBuilder.instance();

      var resultWithString = instance._keyValueToQueryArr('propertyOrKey','value');
      resultWithString.should.have.instanceOf(Array);
      resultWithString.should.have.lengthOf(3);
      resultWithString.join(' ').should.eql("propertyOrKey = 'value'");

      var resultWithNumber = instance._keyValueToQueryArr('propertyOrKey',5);
      resultWithNumber.join(' ').should.eql("propertyOrKey = 5");

      var resultWithBoolean = instance._keyValueToQueryArr('propertyOrKey',false);
      resultWithBoolean.join(' ').should.eql("propertyOrKey = false");
      done();
    });

    it('helper builds where query part', function(done){
      var instance = builder.QueryBuilder.instance();
      instance.setMatch({
        and$:{
          one: true,
          two: 12345,
          three: 'flower'
        },
        in$: {
          now: 'is ignored'
        }
      });
      var result = instance._buildWhereQueryPart();
      result.should.have.instanceOf(String);
      result.should.eql("WHERE one = true AND two = 12345 AND three = 'flower'");
      done();
    });

    it('throws when invoking build method',function(done){
      var instance = builder.QueryBuilder.instance();
      should.throws(function(){
        instance.build();
      });
      done();
    });
  });

  describe('DeleteQueryBuilder', function(){
    it('in exports is an object', function(done){
      builder.DeleteQueryBuilder.should.be.an.instanceOf(Object);
      builder.DeleteQueryBuilder.should.have.property('instance');
      builder.DeleteQueryBuilder.should.have.property('constructor');
      done();
    });

    it('builds new instance', function(done){
      var instance = builder.DeleteQueryBuilder.instance();
      instance.should.have.property('column_family');
      instance.should.have.property('match');
      instance.should.have.property('values');
      instance.should.have.instanceOf(builder.DeleteQueryBuilder.constructor);
      done();
    });

    it('instance has instance method', function(done){
      var instance = builder.DeleteQueryBuilder.instance();
      var instanceOther = instance.instance();
      instance.should.not.be.exactly(instanceOther);
      instance.should.have.instanceOf(builder.DeleteQueryBuilder.constructor);
      instanceOther.should.have.instanceOf(builder.DeleteQueryBuilder.constructor);
      done();
    });

    it('builds query',function(done){
      var instance = builder.DeleteQueryBuilder.instance();
      instance.setColumnFamily('abc')
      instance.setMatch({
        and$:{
          one: true,
          two: 12345,
          three: 'flower'
        },
        in$: {
          now: 'is ignored'
        }
      });
      var result = instance.build();
      result.should.eql("DELETE FROM abc WHERE one = true AND two = 12345 AND three = 'flower'");
      done();
    });
  });

  describe('SelectQueryBuilder', function(){
    it('in exports is an object', function(done){
      builder.SelectQueryBuilder.should.be.an.instanceOf(Object);
      builder.SelectQueryBuilder.should.have.property('instance');
      builder.SelectQueryBuilder.should.have.property('constructor');
      done();
    });

    it('builds new instance', function(done){
      var instance = builder.SelectQueryBuilder.instance();
      instance.should.have.property('column_family');
      instance.should.have.property('match');
      instance.should.have.property('values');
      instance.should.have.instanceOf(builder.SelectQueryBuilder.constructor);
      done();
    });

    it('instance has instance method', function(done){
      var instance = builder.SelectQueryBuilder.instance();
      var instanceOther = instance.instance();
      instance.should.not.be.exactly(instanceOther);
      instance.should.have.instanceOf(builder.SelectQueryBuilder.constructor);
      instanceOther.should.have.instanceOf(builder.SelectQueryBuilder.constructor);
      done();
    });

    it('builds query',function(done){
      var instance = builder.SelectQueryBuilder.instance();
      instance.setColumnFamily('abc');
      instance.setMatch({
        and$:{
          one: true,
          two: 12345,
          three: 'flower'
        },
        in$: {
          now: 'is ignored'
        }
      });
      var result = instance.build();
      result.should.eql("SELECT * FROM abc WHERE one = true AND two = 12345 AND three = 'flower'");
      done();
    });
  });

  describe('UpdateQueryBuilder', function(){
    it('in exports is an object', function(done){
      builder.UpdateQueryBuilder.should.be.an.instanceOf(Object);
      builder.UpdateQueryBuilder.should.have.property('instance');
      builder.UpdateQueryBuilder.should.have.property('constructor');
      done();
    });

    it('builds new instance', function(done){
      var instance = builder.UpdateQueryBuilder.instance();
      instance.should.have.property('column_family');
      instance.should.have.property('match');
      instance.should.have.property('values');
      instance.should.have.instanceOf(builder.UpdateQueryBuilder.constructor);
      done();
    });

    it('instance has instance method', function(done){
      var instance = builder.UpdateQueryBuilder.instance();
      var instanceOther = instance.instance();
      instance.should.not.be.exactly(instanceOther);
      instance.should.have.instanceOf(builder.UpdateQueryBuilder.constructor);
      instanceOther.should.have.instanceOf(builder.UpdateQueryBuilder.constructor);
      done();
    });

    it('builds query',function(done){
      var instance = builder.UpdateQueryBuilder.instance();
      instance.setColumnFamily('abc');
      instance.setValues({
        name: 'Alice',
        age: 19,
        is_married: false
      })
      instance.setMatch({
        and$:{
          one: true,
          two: 12345,
          three: 'flower'
        },
        in$: {
          now: 'is ignored'
        }
      });
      var result = instance.build();
      result.should.eql("UPDATE abc SET name = 'Alice' , age = 19 , is_married = false WHERE one = true AND two = 12345 AND three = 'flower'");
      done();
    });
  });

});
