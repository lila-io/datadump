'use strict';

var
	mongoose = require('mongoose'),
  BucketItemSchema,
	ObjectId = mongoose.Schema.ObjectId,
  Mixed = mongoose.Schema.Types.Mixed,
  config = require('../conf/config')
;

function setNullIfBlank (val) {
  if ('string' === typeof val && val.trim() === '') val = null;
  return val;
}

BucketItemSchema = new mongoose.Schema({
  bucket: { type: ObjectId, ref: 'Bucket', required: true, set:setNullIfBlank },
  dateCreated: { type: Date, default: Date.now, required:true, set:setNullIfBlank },
  data: { type: Mixed, required:true }
},{ autoIndex: false, collection: config.db.prefix + 'bucket_item' });

module.exports = mongoose.model('BucketItem', BucketItemSchema);
