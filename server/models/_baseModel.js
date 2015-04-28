'use strict';

var events = require('events');
var util = require('util');

function BaseModel(){
  events.EventEmitter.call(this);
}

util.inherits(BaseModel, events.EventEmitter);

module.exports = BaseModel;
