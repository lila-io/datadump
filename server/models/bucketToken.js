'use strict';

var
	mongoose = require('mongoose'),
  BucketTokenSchema,
	ObjectId = mongoose.Schema.ObjectId,
  config = require('../conf/config')
;

function setNullIfBlank (val) {
  if ('string' === typeof val && val.trim() === '') val = null;
  return val;
}

BucketTokenSchema = new mongoose.Schema({
  bucket: { type: ObjectId, ref:'Bucket', required: true, set: setNullIfBlank },
  token: { type: String, required: true, unique: true, set: setNullIfBlank },
  dateCreated: { type: Date, default: Date.now, required: true, set: setNullIfBlank }
},{ autoIndex: false, collection: config.db.prefix + 'bucket_token' });

module.exports = mongoose.model('BucketToken', BucketTokenSchema);
