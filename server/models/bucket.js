'use strict';

var
	mongoose = require('mongoose'),
  BucketSchema,
	ObjectId = mongoose.Schema.ObjectId,
  config = require('../conf/config')
;

function setNullIfBlank (val) {
  if ('string' === typeof val && val.trim() === '') val = null;
  return val;
}

BucketSchema = new mongoose.Schema({
  user: { type: ObjectId, ref: 'User', required: true, set:setNullIfBlank },
  description: { type: String, required: true, set:setNullIfBlank },
  path: { type: String, required: true, set:setNullIfBlank },
  dateCreated: { type: Date, default: Date.now, required:true, set:setNullIfBlank },
  isPublic: { type: Boolean, required: true, default: false, set:setNullIfBlank }
},{ autoIndex: false, collection: config.db.prefix + 'bucket' });

BucketSchema.index({ user: 1, path: 1 }, { unique: true });

module.exports = mongoose.model('Bucket', BucketSchema);
