'use strict';

/* jshint unused:false */

var
	router = require('express').Router(),
	bucketService = require('../services/BucketService'),
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

router.get('/:id', function (req, res) {

  var itemId = req.params.id;
  var userId = null;

  if (ras.requiresResourceOwnerIdForOne(req)) {
    if(!ras.resourceOwnerExists(req)){
      return res.status(400).send({errors : ['User not found in path']});
    }
    userId = ras.resourceOwnerId(req);
  }

  bucketService.findOne(itemId, userId, function (err, item) {
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

  /* jshint maxcomplexity:7 */

  req = req || {};
  req.query = req.query || {};

  var searchOptions = {};

  if (req.query.query) {
    var cleanedQuery = req.query.query.replace(/\W+/g, ' ');
    searchOptions.query = cleanedQuery;
  }

  if (req.query.isPublic != null) {
    searchOptions.isPublic = req.query.isPublic === 'true';
  }
  if(ras.requiresPublicList(req)){
    console.log('requiresPublicList')
    searchOptions.isPublic = true;
  }

  if (ras.requiresResourceOwnerIdForList(req)) {
    searchOptions.user = ras.resourceOwnerId(req);
  }

  return searchOptions;
}

function buildPositionalOptions(req){

  /* jshint maxcomplexity:7 */

  req = req || {};
  req.query = req.query || {};

  return {
    max    : Math.min((parseInt(req.query.max,10) || 10), 100),
    offset : parseInt(req.query.offset,10) || 0,
    sort   : req.query.sort || 'dateCreated',
    order  : req.query.order === 'asc' ? 'asc' : 'desc'
  };
}

router.get('/', function (req, res) {

  /* jshint maxcomplexity:15 */

  if(!ras.hasAccessToList(req)){
    res.status(401).end();
    return;
  }

  var positional = buildPositionalOptions(req);
  var searchOptions = buildSearchOptions(req);

  bucketService.list(searchOptions, positional, function (err, items, total) {
    if (err != null) {
      return res.status(400).send({errors: [err]});
    }

    res.send({data : items, total : total});
  });

});


router.post('/', authAllowUser, function (req, res) {

	var itemData = {
		path        : req.param('path') || '',
		description : req.param('description') || '',
		isPublic    : (req.param('isPublic') + '') === 'true',
    user        : req.user._id,
		data        : []
	};

	bucketService.createOne(itemData, function (err, item) {
		if (err != null) {
      return res.status(400).send({errors: [err]});
		}

		res.send({data:item});
	});

});


/** UPDATE item accessibility
 |----------------+----------+--------------+------------+-------------|
 | authentication | pathUser | resourceUser | has access | HTTP status |
 |----------------+----------+--------------+------------+-------------|
 | user           | guest    | user         | FALSE      | 403         |
 | user           | guest    | self         | TRUE       | 200         |
 | user           | me       | user         | FALSE      | 403         |
 | user           | me       | self         | TRUE       | 200         |
 | user           | admin    | *            | FALSE      | 403         |
 | user           | user     | user         | FALSE      | 403         |
 | user           | user     | self         | TRUE       | 200         |
 |----------------+----------+--------------+------------+-------------|
 | admin          | *        | *            | TRUE       | 200         |
 |----------------+----------+--------------+------------+-------------|
 */
router.put('/:id', authAllowUser, function (req, res) {

  if(!ras.canAccessModifyResourcePath(req)){
    res.status(403).end();
    return;
  }

  var itemId = req.params.id;
  var userId = ras.resourceOwnerId(req);
  var updateFields = {};
  if (req.param('title') != null) {
    updateFields.title = req.param('title');
  }
  if (req.param('description') != null) {
    updateFields.description = req.param('description');
  }
  if (req.param('isPublic') != null) {
    updateFields.isPublic = (req.param('isPublic') + '' === 'true');
  }

  bucketService.findOne(itemId, userId, function (err, item) {
    if (err != null) {
      return res.status(400).send({errors : [err]});
    }
    if( !item ){
      res.status(404).end();
    } else {

      if(!ras.canModifyResource(req,item)){
        res.status(403).end();
        return;
      }

      bucketService.updateOne(itemId, updateFields, function (errr, item) {
        if (errr != null) {
          res.status(400).send({errors: [errr]});
          return;
        }

        res.send({data:item});
      });
    }
  });

});

/** DELETE item accessibility
 |----------------+----------+--------------+------------+-------------|
 | authentication | pathUser | resourceUser | has access | HTTP status |
 |----------------+----------+--------------+------------+-------------|
 | user           | guest    | user         | FALSE      | 403         |
 | user           | guest    | self         | TRUE       | 200         |
 | user           | me       | user         | FALSE      | 403         |
 | user           | me       | self         | TRUE       | 200         |
 | user           | admin    | *            | FALSE      | 403         |
 | user           | user     | user         | FALSE      | 403         |
 | user           | user     | self         | TRUE       | 200         |
 |----------------+----------+--------------+------------+-------------|
 | admin          | *        | *            | TRUE       | 200         |
 |----------------+----------+--------------+------------+-------------|
 */
router.delete('/:id', authAllowUser, function (req, res) {

  if(!ras.canAccessModifyResourcePath(req)){
    res.status(403).end();
    return;
  }

  var itemId = req.params.id;
  var userId = ras.resourceOwnerId(req);

  bucketService.findOne(itemId, userId, function (err, item) {
    if (err != null) {
      return res.status(400).send({errors : [err]});
    }
    if( !item ){
      res.status(404).end();
    } else {

      if(!ras.canModifyResource(req,item)){
        res.status(403).end();
        return;
      }

      bucketService.deleteOne(itemId, userId, function (errrr) {
        if (errrr != null) {
          return res.status(400).send({errors: [errrr]});
        }
        res.status(204).end();
      });
    }
  });

});

module.exports = router;
