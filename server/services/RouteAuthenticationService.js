/**
 * routeAuthentication.js
 * Simple auth service
 * */

'use strict';

var
  mongoose = require('mongoose'),
	conf = require('../conf/config'),
	roleCompareService = require('./RoleCompareService')
  ;

function Authentication(){
  this.anonymousAuthenticationRoles = ['permitAll','IS_AUTHENTICATED_ANONYMOUSLY'];
}

Authentication.prototype.require = function(ROLE){

  var self = this;

	if ('string' !== typeof ROLE){
		throw new Error('ROLE is required');
	}

	return function(req,res,next){

		var i, j, idx, userRolesIds, userRoles = [], authorities, userBeingAuthenticated, userAllowed = false;

		function failed(){
      res.status(conf.auth.codes.unauthorized).end();
		}
    function forbidden(){
      res.status(conf.auth.codes.forbidden).end();
    }

    function requireAnonymous(){
      return self.anonymousAuthenticationRoles.indexOf(ROLE) > -1;
    }

		function pushRoles(roleArr){

			userRoles = userRoles.concat(roleArr);

			if(idx === 0 && userRoles.length === 0) {
        return forbidden();
      } else if (idx===0){

				for (j = userRoles.length - 1; j >= 0; --j) {
					if(userRoles[j] === ROLE) {
            userAllowed = true;
          }
				}

        if(userAllowed){
          req.user = userBeingAuthenticated;
          return next();
        } else {
          return forbidden();
        }
			}
		}

		function check(err,roles){

      /* jshint maxcomplexity:10 */

			if(err) {
				next(err);
				return;
			}

			if(!roles || roles.length < 1) {
				return forbidden();
			}

			for (i = roles.length - 1; i >= 0; --i) {
				idx = i;
				if(roles[idx].authority === ROLE){
          userAllowed = true;
				}
			}

      if(requireAnonymous()){
        userAllowed = true;
      }

      if(userAllowed){
        req.user = userBeingAuthenticated;
        return next();
      }

			for (i = roles.length - 1; i >= 0; --i) {
				idx = i;
				pushRoles( roleCompareService.getLowerRoles(roles[idx].authority) );
			}

		}

		function checkUserRole(){

			userRolesIds = [];
			authorities = userBeingAuthenticated.authorities;

			if (!authorities || authorities.length < 1) {
        if(requireAnonymous())
          return next();

				return forbidden();
			}

			if(authorities[0].toString() === '[object Object]'){
				// user authorities were populated with
				// actual ROLE docs
				for(var ii = 0; ii < authorities.length; ii++){
					userRolesIds.push(authorities[ii]._id);
				}
			} else {
				userRolesIds = authorities;
			}

			mongoose.model('Role').find({'_id':{$in:userRolesIds}},check);
		}

		if ( req.user ) {
      userBeingAuthenticated = req.user;
			checkUserRole();
		} else {


      if(req.method === 'OPTIONS'){
        res.status(200).end();
        return;
      }

      // use req._passport.instance as it is already
      // attached by authentication config
      req._passport.instance.authenticate('bearer', { session: false }, function(error, user){
        if(error) return failed();
        if(!user && requireAnonymous()) return next();
        if(!user) return failed();
        userBeingAuthenticated = user;
        checkUserRole();
      })(req, res, next);
		}
	};
};

module.exports = exports = new Authentication();
