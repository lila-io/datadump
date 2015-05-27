'use strict';

var events = require('events');
var util = require('util');

function UpdateQueryBuilder(){

  if(! (this instanceof UpdateQueryBuilder)){
    return new UpdateQueryBuilder();
  }

  this.column_family;
  this.values = {};
  this.matches = {};

  return this;
}

UpdateQueryBuilder.prototype.setColumnFamily = function(cf){
  this.column_family = cf;
  return this;
};

UpdateQueryBuilder.prototype.setValues = function(values){
  this.values = values;
  return this;
};

UpdateQueryBuilder.prototype.setMatches = function(matches){
  this.matches = matches;
  return this;
};

UpdateQueryBuilder.prototype.keyValueToQueryArr = function(key,value){

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

UpdateQueryBuilder.prototype.build = function(){

  var self = this;
  var query = ['UPDATE',self.column_family,'SET'];

  Object.keys(self.values).forEach(function(fieldName,index,array){

    query = query.concat( self.keyValueToQueryArr(fieldName, self.values[fieldName]) );

    if(index < (array.length - 1)){
      query.push(',');
    }
  });

  query.push('WHERE');

  Object.keys(self.matches).forEach(function(fieldName,index,array){

    query = query.concat( self.keyValueToQueryArr(fieldName, self.matches[fieldName]) );

    if(index < (array.length - 1)){
      query.push('AND');
    }
  });

  return query.join(' ');
};


exports.UpdateQueryBuilder = UpdateQueryBuilder;

