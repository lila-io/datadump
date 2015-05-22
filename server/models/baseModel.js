'use strict';

var events = require('events');
var util = require('util');
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;
var datasource = require('../conf/datasource');
var UpdateQueryBuilder = require('./queryBuilder').UpdateQueryBuilder;


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
BaseModel.prototype.getPrimaryFields = function(){
  var fields = [], self = this;
  Object.keys(self.columns).forEach(function(col,idx){
    if(self.columns[col].primary){
      fields.push(col);
    }
  });
  return fields;
}

BaseModel.prototype._createError = function(errorString){
  return {error: errorString};
};

BaseModel.prototype._addError = function(errorString){
  var err = this._createError(errorString);
  this.allErrors.errors.push( err );
};


BaseModel.prototype._getPropertyErrors = function(name,value,isUpdate){

  var self = this;
  var primary = self.getPrimaryFields();
  var errors = [];

  var isColumnBoolean = self.columns[name].type === 'boolean';
  var isValueDefined = (typeof value !== 'undefined');
  var isValueNull = (value === null);
  var isValueBlank = ((value + '').trim() === '');
  var isValueBoolean = (typeof value === 'boolean');

  if(isColumnBoolean && isValueDefined && !isValueBoolean){
    errors.push(self._createError((name + ' must be boolean')));
  }

  if(!isUpdate){

    if(primary.indexOf(name) > -1 && ( !isValueDefined || isValueNull || isValueBlank) ){
      errors.push(self._createError((name + ' is required')));
    }

  } else {

    if(primary.indexOf(name) > -1){
      errors.push(self._createError((name + ' is part of primary key and cannot be changed')));
    }

  }

  return errors;
};


/**
 * Check if instance properties match schema requirements
 * @returns {boolean}
 */
BaseModel.prototype.validate = function(){

  var self = this;
  var validatableData = self.props || {};
  var fieldsForValidation = Object.keys(validatableData);
  var primary = self.getPrimaryFields();

  // check required first
  primary.forEach(function(requiredField){
    var propErrors = self._getPropertyErrors(requiredField,validatableData[requiredField]);
    self.allErrors.errors = self.allErrors.errors.concat( propErrors );
  });

  fieldsForValidation.forEach(function(name,idx){
    // skip required fields
    if(primary.indexOf(name) < 0){
      var propErrors = self._getPropertyErrors(name,validatableData[name]);
      self.allErrors.errors = self.allErrors.errors.concat( propErrors );
    }
  });

  if(self.allErrors.errors.length){
    return false;
  }

  return true;
};

/**
 * Check if payload is not touching primary keys
 * @param data
 * @returns {boolean}
 */
BaseModel.prototype.validateForUpdate = function(data){

  var self = this;
  var validatableData = data || {};

  Object.keys(validatableData).forEach(function(name,idx){
    var propErrors = self._getPropertyErrors(name,validatableData[name],true);
    self.allErrors.errors = self.allErrors.errors.concat( propErrors );
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

  if(!self.validateForUpdate(props)){
    return callback(self.errors());
  }

  self.prepareUpdateStatement(where, props, function(err,query){
    if(err) {
      return callback(err);
    }
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
  var setDataKeys = Object.keys(setData);
  var length = setDataKeys.length;
  var errors = [];

  if(!self.column_family){
    errors.push('column_family is not defined');
  }

  if(!setDataKeys.length){
    errors.push('setData not provided');
  }

  if(!Object.keys(whereData).length){
    errors.push('whereData not provided');
  }

  if(errors.length){
    return cb( errors.join('; ') )
  }

  /**
   * If value requires to be hashed, convert value
   */
  setDataKeys.forEach(function(fieldName,index,array){
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

    var query = UpdateQueryBuilder()
      .setColumnFamily(self.column_family)
      .setValues(dataNew)
      .setMatches(whereData)
      .build();

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
