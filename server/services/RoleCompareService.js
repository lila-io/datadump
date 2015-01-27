'use strict';

var
	conf = require('../conf/config'),
	roleConfig = conf.auth.roleConfig
;

// TODO externalze role config to constructor
// or init function
function RoleHierarchy(){}

/**
 * @param rl {String} Role to check against
 * @return Array
 */
RoleHierarchy.prototype.getDirectLowerRoles = function(rl){

  /* jshint maxcomplexity:10 */

	if ('string' !== typeof rl){
		throw new Error('role is required');
	}
	if (!Array.isArray(roleConfig)) {
		throw new Error('role config requires array');
	}
	if ( roleConfig.length < 1 ) {
		return [];
	}
	var lowerRoles = [], configRoles = roleConfig;

	for(var i = 0; i < configRoles.length; i++){
		if ( configRoles[i].indexOf('>') !== -1 ){
			var parts = configRoles[i].split('>');
			// push first level
			if( parts.length === 2 && parts[0].trim() === rl ){
				lowerRoles.push(parts[1].trim());
			}
		}
	}

  return lowerRoles;
};

/**
 * @param rl {String} Role to check against
 * @return Array
 */
RoleHierarchy.prototype.getLowerRoles = function(rl) {

  /* jshint maxdepth:8,maxcomplexity:10 */

	if ('string' !== typeof rl) {
		throw new Error('role is required');
	}

	var self = this, lowerRoles = [], roleCache = [];

	lowerRoles = roleCache = self.uniqueRoles( lowerRoles.concat( self.getDirectLowerRoles(rl) ) );

	// go deeper
	if (lowerRoles.length > 0){

		var i, j, secondLayer = [], thirdLayer = [];

		for (i = lowerRoles.length - 1; i >= 0; --i) {

			secondLayer = self.uniqueRoles( secondLayer.concat(self.getDirectLowerRoles( lowerRoles[i])) );

			if( i === 0 ){

				lowerRoles = lowerRoles.concat(secondLayer);

				if (lowerRoles.length !== roleCache.length) {

					// extract difference and iterate
					// through newly added roles again

					// extract `fresh` roles
					var diff = self.diff(lowerRoles,roleCache);

					// renew cache
					roleCache = lowerRoles;

					// look for third layer
					for (j = diff.length - 1; j >= 0; --j) {

						thirdLayer = self.uniqueRoles( thirdLayer.concat(self.getDirectLowerRoles(diff[j])) );

						if( j === 0 ){
							lowerRoles = lowerRoles.concat(thirdLayer);
							return lowerRoles;
						}
					}

				} else {

					return lowerRoles;

				}
			}
		} // end for loop

	} else {
		return lowerRoles;
	}

};

/**
 * @param arr1 {Array} array to check
 * @param arr2 {Array} array which reveals diff
 * @return Array
 */
RoleHierarchy.prototype.diff = function(arr1,arr2) {
	if ( !Array.isArray(arr1) || !Array.isArray(arr2) ) {
		throw new Error('two arrays required');
	}
	return arr1.filter(function(el) {
		return ( arr2.indexOf(el) < 0 );
	});
};

/**
 * @param arr {Array} Roles to filter
 * @return Array
 */
RoleHierarchy.prototype.uniqueRoles = function(arr){

	if (!Array.isArray(arr)) {
		throw new Error('array of roles required');
	}
	var o = {}, i, l = arr.length, r = [];
	for(i=0; i<l;i+=1) {
		o[arr[i]] = arr[i];
	}
	for(i in o) {
		r.push(o[i]);
	}
	return r;

};


RoleHierarchy.prototype.rolesHaveAccessFor = function(rolesToCheckArray, againstRole){

  /* jshint maxcomplexity:10 */

	if (!Array.isArray(rolesToCheckArray) || !rolesToCheckArray.length) {
		throw new Error('first argument has to be array of role strings');
	}

	if('string' !== typeof againstRole) {
		throw new Error('second argument has to role string');
	}

	var self = this, lowerRoles = [], i;

	// check direct match
	for(i = 0; i < rolesToCheckArray.length; i++){
		if( rolesToCheckArray[i] === againstRole){
			return true;
		}
	}

	// collect all lower roles
	for(i = 0; i < rolesToCheckArray.length; i++){
		lowerRoles = self.uniqueRoles(lowerRoles.concat( self.getLowerRoles(rolesToCheckArray[i]) ));
	}

	for(i = 0; i < lowerRoles.length; i++){
		if( lowerRoles[i] === againstRole){
			return true;
		}
	}

	return false;
};


module.exports = exports = new RoleHierarchy();
