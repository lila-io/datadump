'use strict';

var
  DEFAULT_ROLE = 'ROLE_USER',
  models = require('../models')
;

var verifyDefaultRoleExists = function(user, cb) {

  if (!user) {
    throw new Error('Could not get/create user based on profile: ', user);
  }

  if(!user.authorities.length){

    models.user.addRolesForUsername(user.username,[DEFAULT_ROLE],function(err,updatedUser){
      if (err) {
        return cb(err);
      }
      cb(null,updatedUser);
    });
  } else {
    cb(null,user);
  }

};


function getProviderUser(providerName, profile, done) {

  var userProfile = {
    username: profile._json.id,
    password: (Math.random() + ''),
    authorities: [DEFAULT_ROLE],
    is_enabled: true,
    date_created: (new Date())
  };
  userProfile[providerName] = profile._json;

  if(profile._json.name){
    userProfile.display_name = profile._json.name;
  }
  if(profile._json.email){
    userProfile.email = profile._json.email;
  }

  models.user.findByProviderProfileAndUpdate(providerName, profile._json, function(err, existingUser) {
    if (err) {
      done(err);
    } else if(existingUser) {
      verifyDefaultRoleExists(existingUser, done);
    } else {
      models.user.insertProviderUser(userProfile, function(err) {
        if (err) {
          done(err);
        } else {
          delete userProfile.password;
          done(null, userProfile);
        }
      });
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

  getProviderUser('facebook', profile, cb);
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

  getProviderUser('google', profile, cb);
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

  getProviderUser('twitter', profile, cb);
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

  getProviderUser('github', profile, cb);
};
