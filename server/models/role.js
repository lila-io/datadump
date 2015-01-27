'use strict';

var
	mongoose = require('mongoose'),
	RoleSchema,
  config = require('../conf/config')
;

RoleSchema = new mongoose.Schema({
		authority: { type: String, required: true, unique : true}
},{ autoIndex: false, collection: config.db.prefix + 'role' });

RoleSchema.statics.findOrCreate = function (authority, cb) {

  var self = this;

  self.find({ authority: authority }, function(e1,roles){
    if(e1) return cb(e1);

    if(roles && roles.length) {
      if(roles.length > 1){
        throw new Error('More than one role with the same authority');
      }
      cb(null,roles[0]);
    } else {
      self.create({authority: authority}, function(e12,newRole){
        if(e12) return cb(e12);
        console.log('Role %s created: %s', newRole.authority, newRole);
        cb(null,newRole);
      });
    }
  });
};

module.exports = mongoose.model('Role', RoleSchema);
