'use strict';

var events = require('events');
var util = require('util');
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;
var datasource = require('../conf/datasource');


function BaseModel(options){
  events.EventEmitter.call(this);
  var opts = options || {};
  this.column_family = opts.column_family || '';
  this.columns = opts.columns || {};
  this.props = opts.props || {};
  this.allErrors = opts.allErrors || {errors:[]};
}

util.inherits(BaseModel, events.EventEmitter);

/**
 * Get required field names
 * @returns {Array}
 */
BaseModel.prototype.getRequiredFields = function(){
  var fields = [], self = this;
  Object.keys(self.columns).forEach(function(col,idx){
    if(self.columns[col].required){
      fields.push(col);
    }
  });
  return fields;
}

/**
 * Check if instance properties match schema requirements
 * @returns {boolean}
 */
BaseModel.prototype.validate = function(data){

  var self = this;
  var validatableData = data || self.props;
  var required = this.getRequiredFields();

  // first check if type matches
  Object.keys(self.columns).forEach(function(col,idx){

    var isColumnBoolean = self.columns[col].type === 'boolean';
    var isValueDefined = (typeof validatableData[col] !== 'undefined');
    var isValueBoolean = (typeof validatableData[col] === 'boolean');

    if(isColumnBoolean && isValueDefined && !isValueBoolean){
      self.allErrors.errors.push( {error:(col + ' must be boolean')} )
    }
  });

  required.forEach(function(key,idx){
    if(!validatableData[key]){
      self.allErrors.errors.push( {error:(key + ' is required')} )
    }
  });

  if(self.allErrors.errors.length){
    return false;
  }

  return true;
};

/**
 * Get current errors object
 * @returns {*|{errors: Array}}
 */
BaseModel.prototype.errors = function(){
  return this.allErrors;
};

BaseModel.prototype.find = function(props, callback){

  var self = this;

  self.prepareSelectStatement(props, function(err,query){
    datasource.getClient().execute(query, null, null, function(err, data){
      if(err) {
        return callback(err);
      }

      if(!data || data.rowLength === 0){
        return callback(null,null);
      }

      var results = [];

      data.rows.forEach(function(dataRow,index,array){

        var cols = dataRow.keys();
        var o = {};
        cols.forEach(function(colName,idx){
          o[colName] = dataRow.get(colName);
        });

        results.push(o);
      });

      callback(null,results);
    });
  });
};

/**
 * Insert instance data
 * @param callback
 */
BaseModel.prototype.save = function(callback){

  var self = this;

  if(!self.validate()){
    return callback(self.errors());
  }

  self.prepareInsertStatement(self.props, function(err,statement){
    datasource.getClient().execute(statement.query, statement.values, {prepare: true}, function(err){
      if(err) {
        callback(err);
      } else {
        callback(null,self.props);
      }
    });
  });
};

BaseModel.prototype.update = function(where,props,callback){

  var self = this;

  if(!self.validate(props)){
    console.log(self.errors())
    return callback(self.errors());
  }

  self.prepareUpdateStatement(where, props, function(err,query){
    datasource.getClient().execute(query, null, null, function(err){
      if(err) {
        return callback(err);
      }

      callback();
    });
  });
};

// TODO: implement deletes
BaseModel.prototype.delete = function(){};

/**
 * Prepare statement for selecting data
 * to be used by cassandra driver
 * @param data
 * @param cb
 */
BaseModel.prototype.prepareSelectStatement = function(data, cb){

  data = data || {};
  var fields = Object.keys(data);

  if(!this.column_family){
    throw new Error('table is not defined');
  }
  if(!fields){
    throw new Error('data not provided');
  }

  var query = "SELECT * FROM " + this.column_family + " WHERE ";

  fields.forEach(function(fieldName,index,array){
    query += (fieldName + " = " + "'" + data[fieldName]) + "'";
    if(index < (array.length - 1)){
      query += " AND ";
    }
  });

  cb(null,query);
};

/**
 * Prepare statement and its values for inserting
 * provided data with cassandra driver
 * @param data
 * @param cb
 * @returns {*}
 */
BaseModel.prototype.prepareInsertStatement = function(data, cb){

  data = data || {};
  var self = this;
  var dataNew = {};
  var fields = [];
  var questionmarks = [];
  var values = [];

  if(!self.column_family){
    return cb('column_family is not defined');
  }

  var length = Object.keys(data).length;

  if(!length){
    return cb('data not provided');
  }

  /**
   * If value requires to be hashed, convert value
   */
  Object.keys(data).forEach(function(fieldName,index,array){
    if(self.columns[fieldName].hashed){
      self.hashValue(data[fieldName],function(err,hashed){
        dataNew[fieldName] = hashed;
        continuePrepartion();
      });
    } else {
      dataNew[fieldName] = data[fieldName];
      continuePrepartion();
    }
  });

  function continuePrepartion(){

    length -= 1;
    if(length > 0) return;

    fields = Object.keys(dataNew);

    /**
     * Fill array of questionmarks
     * Fill array of values to be used
     */
    fields.forEach(function(fieldName,index,array){
      questionmarks.push('?');
      values.push(dataNew[fieldName]);
    });

    var query = 'INSERT INTO ' + self.column_family + ' (' + fields.join(', ') + ') VALUES (' + questionmarks.join(', ') + ')';

    cb(null, {
      query:query,
      values:values
    });
  }
};

BaseModel.prototype.prepareUpdateStatement = function(whereData, setData, cb){

  setData = setData || {};
  whereData = whereData || {};
  var self = this;
  var dataNew = {};

  if(!self.column_family){
    return cb('column_family is not defined');
  }

  if(!Object.keys(setData).length){
    return cb('setData not provided');
  }

  if(!Object.keys(whereData).length){
    return cb('whereData not provided');
  }

  /**
   * If value requires to be hashed, convert value
   */
  Object.keys(setData).forEach(function(fieldName,index,array){
    if(self.columns[fieldName].hashed){
      self.hashValue(setData[fieldName],function(err,hashed){
        dataNew[fieldName] = hashed;
        continuePrepartion();
      });
    } else {
      dataNew[fieldName] = setData[fieldName];
      continuePrepartion();
    }
  });

  function continuePrepartion(){

    length -= 1;
    if(length > 0) return;

    var query = 'UPDATE ' + self.column_family + ' SET ';

    Object.keys(dataNew).forEach(function(fieldName,index,array){
      query += (fieldName + " = " + "'" + dataNew[fieldName]) + "'";
      if(index < (array.length - 1)){
        query += ", ";
      }
    });

    query += " WHERE ";

    Object.keys(whereData).forEach(function(fieldName,index,array){
      query += (fieldName + " = " + "'" + whereData[fieldName]) + "'";
      if(index < (array.length - 1)){
        query += " AND ";
      }
    });

    cb(null, query);
  }
};

/**
 * Helper function for hashing of sensitive data
 * before it gets into DB
 * @param value
 * @param cb
 */
BaseModel.prototype.hashValue = function(value, cb){
  // generate a salt
  bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
    if (err) {
      return cb(err);
    }

    // hash the value using our new salt
    bcrypt.hash(value, salt, function (err, hash) {
      if (err) {
        return cb(err);
      }

      cb(null, hash);
    });
  });
};

/**
 * Helper function for comparison of a value
 * against its hashed representation
 * @param candidate
 * @param encrypted
 * @param cb
 */
BaseModel.prototype.compareHashedValues = function(candidate, encrypted, cb){
  bcrypt.compare(candidate, encrypted, function (err, isMatch) {
    if (err) {
      return cb(err);
    }
    cb(null, isMatch);
  });
};

module.exports = BaseModel;
