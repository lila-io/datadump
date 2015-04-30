'use strict';

var events = require('events');
var util = require('util');

function BaseModel(options){
  events.EventEmitter.call(this);
  var opts = options || {};
  this.column_family = opts.column_family || '';
  this.columns = opts.columns || {};
}

util.inherits(BaseModel, events.EventEmitter);

BaseModel.prototype.prepareInsertStatement = function(data){

  data = data || {};
  var fields = Object.keys(data);
  var questionmarks = [];
  var values = [];

  fields.forEach(function(fieldName,index,array){
    questionmarks.push('?');
    values.push(data[fieldName]);
  });

  if(!this.column_family){
    throw new Error('table is not defined');
  }
  if(!fields || !values){
    throw new Error('data not provided');
  }

  var query = 'INSERT INTO ' + this.column_family + ' (' + fields.join(', ') + ') VALUES (' + questionmarks.join(', ') + ')';

  return {
    query:query,
    values:values
  };
};

module.exports = BaseModel;
