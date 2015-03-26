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

function loadVisibleBucket(req,res,next){

  var bucketId, userId;

  if (ras.requiresResourceOwnerIdForOne(req)) {
    if(!ras.resourceOwnerExists(req)){
      return res.status(400).send({errors : ['User not found in path']});
    }
    userId = ras.resourceOwnerId(req);
  }

  if(!req.params || req.params.bucketId == null){
    return res.status(400).send({errors : ['Bucket not found in path']});
  }

  bucketId = req.params.bucketId;

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

function loadEditableBucket(req,res,next){

  var bucketId, userId;

  if(ras.isGuestPath(req) || !req.params || req.params.bucketId == null){
    return res.status(404).end();
  }

  if(ras.isAnonymous(req.user)){
    return res.status(401).end();
  }

  if(!ras.canAccessModifyResourcePath(req)){
    res.status(403).end();
    return;
  }

  bucketId = req.params.bucketId;
  userId = ras.resourceOwnerId(req);

  bucketService.findOne(bucketId, userId, function (err, bucket) {
    if (err != null) {
      return res.status(400).send({errors : [err]});
    }
    if( !bucket ){
      res.status(404).end();
    } else {

      if(!ras.canModifyResource(req,bucket)){
        res.status(403).end();
        return;
      }

      next(null,bucket);
    }
  });
}

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

router.get('/:bucketItemId', function (req, res) {

  var bucketItemId = req.params.bucketItemId;
  if(!bucketItemId){
    return res.status(404).end();
  }

  loadVisibleBucket(req, res, function(err,bucket){
    bucketItemService.findOne(bucket, bucketItemId, function (err, item) {
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

router.get('/', function (req, res) {

  loadVisibleBucket(req, res, function(err,bucket){
    bucketItemService.list(bucket, buildSearchOptions(req), buildPositionalOptions(req), function (err, items, total) {
      if (err != null) {
        return res.status(400).send({errors: [err]});
      }
      res.send({data : items, total : total});
    });
  });

});

router.post('/', authAllowUser, function (req, res) {

	var itemData = req.body || {};

  loadEditableBucket(req, res, function(err,bucket){
    bucketItemService.createOne(bucket, itemData, function (err, item) {
      if (err != null) {
        return res.status(400).send({errors: [err]});
      }
      if(!item){
        return res.status(400).send({errors: ['Could not save item']});
      }
      res.send({data:item});
    });
  });
});

router.delete('/:bucketItemId', authAllowUser, function (req, res) {

  var bucketItemId = req.params.bucketItemId;

  loadEditableBucket(req, res, function(err,bucket){
    bucketItemService.deleteOne(bucket, bucketItemId, function (err, deleted) {
      if (err != null) {
        return res.status(400).send({errors: [err]});
      }
      if(deleted == null){
        return res.status(404).send({errors: ['Could not delete item']});
      }
      res.status(204).end();
    });
  });

});

module.exports = router;
