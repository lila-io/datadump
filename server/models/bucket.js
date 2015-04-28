'use strict';

var BaseModel = require('./_baseModel');
var util = require('util');

function Bucket(){
  BaseModel.call(this);
  this.constraints = {
    user_id: { type: String },
    description: { type: String },
    path: { type: String },
    date_created: { type: Date },
    is_public: { type: Boolean }
  }
}
util.inherits(Bucket, BaseModel);

module.exports = Bucket;
