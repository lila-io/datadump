'use strict';

var events = require('events');
var util = require('util');
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;


function BaseModel(options){
  events.EventEmitter.call(this);
  var opts = options || {};
  this.column_family = opts.column_family || '';
  this.columns = opts.columns || {};
}

util.inherits(BaseModel, events.EventEmitter);

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

    console.log("query",query,"values",values)

    cb(null, {
      query:query,
      values:values
    });
  }

};

BaseModel.prototype.hashValue = function(value, cb){
  // generate a salt
  bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
    if (err) {
      return cb(err);
    }

    // hash the password using our new salt
    bcrypt.hash(value, salt, function (err, hash) {
      if (err) {
        return cb(err);
      }

      cb(null, hash);
    });
  });
};


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

BaseModel.prototype.compareHashedValues = function(candidate, encrypted, cb){
  bcrypt.compare(candidate, encrypted, function (err, isMatch) {
    if (err) {
      return cb(err);
    }
    cb(null, isMatch);
  });
};

module.exports = BaseModel;
