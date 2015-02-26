'use strict';

/* jshint unused:false */

var
	router = require('express').Router(),
	bucketItemService = require('../services/BucketItemService'),
  ras = require('../services/RouteAccessService'),
	routeAuthenticationService = require('../services/RouteAuthenticationService')
	;

// to allow both anonymous and authenticated access
var allowAll = routeAuthenticationService.require('permitAll');
var authAllowAll = function(req,res,next){
  allowAll.call(this,req,res,next)
}

var allowUser = routeAuthenticationService.require('ROLE_USER');
var authAllowUser = function(req,res,next){
  allowUser.call(this,req,res,next)
}

router.use(authAllowAll);

/** SHOW item accessibility
 |----------------+----------+--------------+----------+------------+-------------|
 | authentication | pathUser | resourceUser | isPublic | has access | HTTP status |
 |----------------+----------+--------------+----------+------------+-------------|
 | *              | *        | *            | YES      | TRUE       | 200         |
 |----------------+----------+--------------+----------+------------+-------------|
 | anonymous      | guest    | *            | NO       | FALSE      | 404         |
 | anonymous      | me       | *            | NO       | FALSE      | 403         |
 | anonymous      | admin    | *            | NO       | FALSE      | 403         |
 | anonymous      | user     | *            | NO       | FALSE      | 403         |
 |----------------+----------+--------------+----------+------------+-------------|
 | user           | guest    | user         | NO       | FALSE      | 403         |
 | user           | guest    | self         | NO       | TRUE       | 200         |
 | user           | me       | user         | NO       | FALSE      | 403         |
 | user           | me       | self         | NO       | TRUE       | 200         |
 | user           | admin    | *            | NO       | FALSE      | 403         |
 | user           | user     | user         | NO       | FALSE      | 403         |
 | user           | user     | self         | NO       | TRUE       | 200         |
 |----------------+----------+--------------+----------+------------+-------------|
 | admin          | *        | *            | NO       | TRUE       | 200         |
 |----------------+----------+--------------+----------+------------+-------------|
 */


// /user-specified-path/ends_With-Id_123
router.get(/^(?:\/){1}([_\-0-9a-zA-Z]+)\/([_\-0-9a-zA-Z]+){1}(?:\/)?$/, function (req, res) {

  var path = req.params[0];
  var itemId = req.params[1];
  var userId = ras.resourceOwnerId(req);

  bucketItemService.findOne(itemId, userId, path, function (err, item) {
    if (err != null) {
      return res.status(400).send({errors : [err]});
    }
    if( ras.isResourceHidden(req.user,req.resourceOwnerType,item) ){
      res.status(404).end();
    } else if ( !ras.hasAccess(req.user,req.resourceOwnerType,item) ){
      res.status(403).end();
    } else {
      res.send({data : item});
    }
  });
});

function buildSearchOptions(req){

  /* jshint maxcomplexity:10 */

  var searchOptions = {};
  req = req || {};
  req.query = req.query || {};

  // TODO: allow items filtering by date
  if(req.query.from){}
  if(req.query.to){}

  return searchOptions;
}

function buildPositionalOptions(req){

  /* jshint maxcomplexity:10 */

  req = req || {};
  req.query = req.query || {};
  return {
    max    : Math.min((parseInt(req.query.max,10) || 10), 100),
    offset : parseInt(req.query.offset,10) || 0,
    sort   : req.query.sort || 'dateCreated',
    order  : req.query.order === 'asc' ? 'asc' : 'desc'
  }
}

router.get(/^(?:\/){1}([_\-0-9a-zA-Z]+)(?:\/)?$/, function (req, res) {

  /* jshint maxcomplexity:15 */

  var path = req.params[0];
  var userId = ras.resourceOwnerId(req);

  if(path == null || userId == null){
    res.status(404).end();
    return;
  }

  if(!ras.canAccessList(req)){
    res.status(401).end();
    return;
  }

  bucketItemService.list(userId, path, buildSearchOptions(req), buildPositionalOptions(req), function (err, items, total) {
    if (err != null) {
      return res.status(400).send({errors: [err]});
    }

    res.send({data : items, total : total});
  });

});


router.post(/^(?:\/){1}([_\-0-9a-zA-Z]+)(?:\/)?$/, authAllowUser, function (req, res) {

  var path = req.params[0];
  var userId = req.user._id;
	var itemData = req.body || {};

	bucketItemService.createOne(userId, path, itemData, function (err, item) {
		if (err != null) {
      return res.status(400).send({errors: [err]});
		}
    if(!item){
      return res.status(400).send({errors: ['Could not save item']});
    }
		res.send({data:item});
	});
});


router.delete(/^(?:\/){1}([_\-0-9a-zA-Z]+)\/([_\-0-9a-zA-Z]+){1}(?:\/)?$/, authAllowUser, function (req, res) {

  if(!ras.canAccessModifyResourcePath(req)){
    res.status(403).end();
    return;
  }

  var path = req.params[0];
  var itemId = req.params[1];
  var userId = ras.resourceOwnerId(req);

  bucketItemService.deleteOne(itemId, userId, path, function (errrr, deleted) {
    if (errrr != null) {
      return res.status(400).send({errors: [errrr]});
    }
    if (deleted == null) {
      return res.status(400).send({errors: ['Could not delete item']});
    }
    res.status(204).end();
  });

});

module.exports = router;
