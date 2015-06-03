'use strict';

var util = require('util');

var instanceMessage = 'You forgot to create an instance of this type';

function QueryBuilder(){
  this.column_family;
  this.matches = {
    and$: {},
    in$: {}
  };
  this.values = {};
  return this;
}

QueryBuilder.prototype.constructor = QueryBuilder;

QueryBuilder.prototype.instance = function(){
  return new this.constructor();
};

QueryBuilder.prototype.setColumnFamily = function(cf){
  this.column_family = cf;
  return this;
};

QueryBuilder.prototype.setMatches = function(matches){
  matches = matches || {};
  this.matches.and$ = matches.and$ || {};
  this.matches.in$ = matches.in$ || {};
  this.matches = matches;
  return this;
};

QueryBuilder.prototype.setValues = function(values){
  this.values = values;
  return this;
};

QueryBuilder.prototype.keyValueToQueryArr = function(key,value){
  var query = [];

  query.push(key);
  query.push('=');

  if(typeof value === 'string'){
    query.push("'" + value + "'");
  } else {
    query.push(value);
  }

  return query;
};

QueryBuilder.prototype._buildWhereQueryPart = function(){

  var query = ['WHERE'];
  var self = this;

  // ANDed part
  //////////////////////

  if( self.matches && self.matches.and$ ){
    Object.keys(self.matches.and$).forEach(function(fieldName,index,array){
      query = query.concat( self.keyValueToQueryArr(fieldName, self.matches.and$[fieldName]) );
      if(index < (array.length - 1)){
        query.push('AND');
      }
    });
  }

  return query.join(' ');
};

QueryBuilder.prototype.build = function(){
  throw new Error('Method build has to be overriden');
};


function DeleteQueryBuilder(props){
  QueryBuilder.call(this, props);
}
util.inherits(DeleteQueryBuilder, QueryBuilder);

DeleteQueryBuilder.prototype.build = function(){
  var self = this;
  var query = ['DELETE','FROM',self.column_family];
  query.push( self._buildWhereQueryPart() );
  return query.join(' ');
};


function SelectQueryBuilder(){
  QueryBuilder.call(this);
}
util.inherits(SelectQueryBuilder, QueryBuilder);

SelectQueryBuilder.prototype.build = function(){
  var self = this;
  var query = ['SELECT','*','FROM',self.column_family];
  query.push( self._buildWhereQueryPart() );
  return query.join(' ');
};


function UpdateQueryBuilder(){
  QueryBuilder.call(this);
}
util.inherits(UpdateQueryBuilder, QueryBuilder);

UpdateQueryBuilder.prototype.build = function(){

  var self = this;
  var query = ['UPDATE',self.column_family,'SET'];

  Object.keys(self.values).forEach(function(fieldName,index,array){
    query = query.concat( self.keyValueToQueryArr(fieldName, self.values[fieldName]) );
    if(index < (array.length - 1)){
      query.push(',');
    }
  });

  query.push( self._buildWhereQueryPart() );

  return query.join(' ');
};


exports.QueryBuilder = {
  constructor: QueryBuilder,
  instance: function(){
    return new QueryBuilder();
  }
};
exports.UpdateQueryBuilder = {
  constructor: UpdateQueryBuilder,
  instance: function(){
    return new UpdateQueryBuilder();
  }
};
exports.SelectQueryBuilder = {
  constructor: SelectQueryBuilder,
  instance: function(){
    return new SelectQueryBuilder();
  }
};
exports.DeleteQueryBuilder = {
  constructor: DeleteQueryBuilder,
  instance: function(){
    return new DeleteQueryBuilder();
  }
};

