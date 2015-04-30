'use strict';

var
  mongoose,
  User,// = mongoose.model('User'),
  Role,// = mongoose.model('Role'),
  DEFAULT_ROLE = 'ROLE_USER',
  async = require('async')
;

var getRole = function(done){
  Role.findOne({authority:DEFAULT_ROLE},function(err,role){
    if (err) {
      done(err);
    } else {
      done(null, role);
    }
  })
}

var userRoleMerge = function(err, results, cb) {

  if(err) return cb(err);

  if (!results.user) {
    throw new Error('Could not get/create user based on profile: ', results.user);
  }

  if(!results.user.authorities.length){
    User.findByIdAndUpdate(results.user._id, {authorities:[results.role._id]}, function(errrr, uuuuu){
      if (errrr) {
        return cb(errrr);
      }
      cb(null,uuuuu);
    })
  } else {
    cb(null,results.user);
  }

};


function getProviderUser(providerName, profile, done) {

  var searchOptions = {};
  searchOptions[providerName+'.id'] = profile._json.id;

  var updateOptions = {};
  updateOptions[providerName] = profile._json;

  var userProfile = { username: profile._json.id };
  userProfile[providerName] = profile._json;



  if(profile._json.name){
    userProfile.displayName = profile._json.name;
  }
  if(profile._json.email){
    userProfile.email = profile._json.email;
  }

  User.findOneAndUpdate(searchOptions, updateOptions, function(err, user) {
    if (err) {
      done(err);
    } else if(user) {
      done(null, user);
    } else {
      User.create(userProfile, function(errr,usrr){
        if(errr) done(err);
        else done(null, usrr);
      })
    }
  });
}



/**
 *
 * Default facebook profile json
 *
 * {
 *   id: '10204259146460433',
 *   first_name: 'Ivar',
 *   gender: 'male',
 *   last_name: 'Prudnikov',
 *   link: 'https://www.facebook.com/app_scoped_user_id/10204259146460433/',
 *   locale: 'en_US',
 *   name: 'Ivar Prudnikov',
 *   timezone: 1,
 *   updated_time: '2013-12-19T19:49:34+0000',
 *   verified: true
 * }
 *
 * @param profile
 * @param cb
 */
exports.getFacebookUser = function(profile, cb){

  if(!profile){
    throw new Error('profile is required');
  }

  if(!profile._json.id){
    throw new Error('profile does not contain id');
  }

  if('function' !== typeof cb){
    throw new Error('Callback is required for getFacebookUser')
  }

  var getUser = function(done) {
    return getProviderUser('facebook', profile, done);
  };

  var asyncCallback = function(err, results){
    userRoleMerge(err, results, cb)
  };

  async.parallel({ user: getUser, role: getRole }, asyncCallback);

};



/**
 *
 * Default google profile json
 *
 * {
 *   id: '112758060649745692637',
 *   email: 'ivar.prudnikov@gmail.com',
 *   verified_email: true,
 *   name: 'Ivar Prudnikov',
 *   given_name: 'Ivar',
 *   family_name: 'Prudnikov',
 *   link: 'https://plus.google.com/112758060649745692637',
 *   picture: 'https://lh5.googleusercontent.com/--yLkpp3wq2A/AAAAAAAAAAI/AAAAAAAAABE/y667Jw6piBQ/photo.jpg',
 *   gender: 'male',
 *   locale: 'en-GB'
 * }
 *
 * @param profile
 * @param cb
 */
exports.getGoogleUser = function(profile, cb){

  if(!profile){
    throw new Error('profile is required');
  }

  if(!profile._json.id){
    throw new Error('profile does not contain id');
  }

  if('function' !== typeof cb){
    throw new Error('Callback is required for getGoogleUser')
  }

  var getUser = function(done) {
    return getProviderUser('google', profile, done);
  };

  var asyncCallback = function(err, results){
    userRoleMerge(err, results, cb)
  };

  async.parallel({ user: getUser, role: getRole }, asyncCallback);

};


exports.getTwitterUser = function(profile, cb){

  if(!profile){
    throw new Error('profile is required');
  }

  if(!profile._json.id){
    throw new Error('profile does not contain id');
  }

  if('function' !== typeof cb){
    throw new Error('Callback is required for getTwitterUser')
  }

  var getUser = function(done) {
    return getProviderUser('twitter', profile, done);
  };

  var asyncCallback = function(err, results){
    userRoleMerge(err, results, cb)
  };

  async.parallel({ user: getUser, role: getRole }, asyncCallback);

};





exports.getGithubUser = function(profile, cb){

  if(!profile){
    throw new Error('profile is required');
  }

  if(!profile._json.id){
    throw new Error('profile does not contain id');
  }

  if('function' !== typeof cb){
    throw new Error('Callback is required for getGithubUser')
  }

  var getUser = function(done) {
    return getProviderUser('github', profile, done);
  };

  var asyncCallback = function(err, results){
    userRoleMerge(err, results, cb)
  };

  async.parallel({ user: getUser, role: getRole }, asyncCallback);

};
