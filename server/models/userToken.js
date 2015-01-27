'use strict';

var
	mongoose = require('mongoose'),
  UserTokenSchema,
	ObjectId = mongoose.Schema.ObjectId,
  expiresSeconds = 60 * 60 * 24,
  config = require('../conf/config')
;

function setNullIfBlank (val) {
  if ('string' === typeof val && val.trim() === '') val = null;
  return val;
}

UserTokenSchema = new mongoose.Schema({
  userId: { type: ObjectId, required: true, set: setNullIfBlank },
  token: { type: String, required: true, unique: true, set: setNullIfBlank },
  dateCreated: { type: Date, default: Date.now, required: true, expires: expiresSeconds, set: setNullIfBlank }
},{ autoIndex: false, collection: config.db.prefix + 'user_token' });

module.exports = mongoose.model('UserToken', UserTokenSchema);
