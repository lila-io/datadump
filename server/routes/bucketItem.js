'use strict';

/* jshint unused:false */

var
	router = require('express').Router(),
	bucketItemService = require('../services/BucketItemService'),
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


function loadBucket(req,res,next){

  var bucketId = req.params.bucketId;
  var userId = null;

  if (ras.requiresResourceOwnerIdForOne(req)) {
    if(!ras.resourceOwnerExists(req)){
      return res.status(400).send({errors : ['User not found in path']});
    }
    userId = ras.resourceOwnerId(req);
  }
  if(!bucketId){
    return res.status(400).send({errors : ['Bucket not found in path']});
  }

  bucketService.findOne(bucketId, userId, function (err, bucket) {
    if (err != null) {
      return res.status(400).send({errors : [err]});
    }
    if( ras.isResourceHidden(req.user,req.resourceOwnerType,bucket) ){
      return res.status(404).end();
    }
    if( !ras.hasAccess(req.user,req.resourceOwnerType,bucket) ){
      return res.status(403).end();
    }

    next(null,bucket);
  });
}


router.get('/:bucketItemId', function (req, res) {

  var itemId = req.params.bucketItemId;
  if(!itemId){
    return res.status(404).end();
  }

  loadBucket(req, res, function(err,bucket){
    bucketItemService.findOne(itemId, bucket._id, function (err, item) {
      if (err != null){
        return res.status(400).send({errors : [err]});
      }
      if(!item){
        return res.status(404).end();
      }
      res.send({data : item});
    });
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

router.get('/', function (req, res) {

  loadBucket(req, res, function(err,bucket){
    bucketItemService.list(bucket._id, buildSearchOptions(req), buildPositionalOptions(req), function (err, items, total) {
      if (err != null) {
        return res.status(400).send({errors: [err]});
      }
      res.send({data : items, total : total});
    });
  });

});


router.post('/', authAllowUser, function (req, res) {

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


router.delete('/:bucketItemId', authAllowUser, function (req, res) {

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
      return res.status(404).send({errors: ['Could not delete item']});
    }
    res.status(204).end();
  });

});

module.exports = router;
