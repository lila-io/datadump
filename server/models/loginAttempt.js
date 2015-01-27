'use strict';

var
	mongoose = require('mongoose'),
	config = require('../conf/config'),
	LoginAttemptSchema
;

LoginAttemptSchema = new mongoose.Schema({
	ip: { type: String, default: '' },
	user: { type: String, default: '' },
	time: { type: Date, default: Date.now, expires: config.auth.loginAttempts.logExpiration }
},{ autoIndex: false, collection: config.db.prefix + 'login_attempt' });

LoginAttemptSchema.index({ ip: 1 });
LoginAttemptSchema.index({ user: 1 });

module.exports = mongoose.model('LoginAttempt', LoginAttemptSchema);
