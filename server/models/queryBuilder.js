'use strict';

var util = require('util');

function QueryBuilder(){
  this.column_family = null;
  this.match = {
    and$: {},
    in$: {}
  };
  this.positional = {};
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

QueryBuilder.prototype.setMatch = function(match){
  match = match || {};
  this.match.and$ = match.and$ || {};
  this.match.in$ = match.in$ || {};
  return this;
};

QueryBuilder.prototype.setPositional = function(pos){
  pos = pos || {};
  var order = 'DESC';
  if(pos.order){
    order = pos.order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  }
  if(pos.sort){
    this.positional[pos.sort] = order;
  }
  if(pos.limit)
    this.positional.limit = pos.limit || 10000;
  return this;
};

QueryBuilder.prototype.setValues = function(values){
  this.values = values;
  return this;
};

QueryBuilder.prototype._keyValueToQueryArr = function(key,value){
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

  if( self.match && self.match.and$ ){
    Object.keys(self.match.and$).forEach(function(fieldName,index,array){
      query = query.concat( self._keyValueToQueryArr(fieldName, self.match.and$[fieldName]) );
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
    query = query.concat( self._keyValueToQueryArr(fieldName, self.values[fieldName]) );
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

