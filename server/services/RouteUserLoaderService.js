'use strict';

var routeAuthenticationService = require('./RouteAuthenticationService');
var UrlAccessType = require('../lib/UrlAccessType');
var mongoose;

function RouteUserLoader(){}

RouteUserLoader.prototype.isUserGuest = function(id){
  return id === UrlAccessType.GUEST;
}

RouteUserLoader.prototype.isUserAdmin = function(id){
  return id === UrlAccessType.ADMIN;
}

RouteUserLoader.prototype.isUserSelf = function(id){
  return id === UrlAccessType.ME;
}

RouteUserLoader.prototype.isUserParticular = function(id){
  return id != null;
}

RouteUserLoader.prototype.setGuestInRequest = function(req,res,next){
  req.resourceOwnerType = UrlAccessType.GUEST;
  req.resourceOwner = {};
  next();
}

RouteUserLoader.prototype.setAdminInRequest = function(req,res,next){
  req.resourceOwnerType = UrlAccessType.ADMIN;
  routeAuthenticationService.require('ROLE_ADMIN')(req, res, function(){
    req.resourceOwner = req.user;
    next();
  });
}

RouteUserLoader.prototype.setSelfInRequest = function(req,res,next){
  req.resourceOwnerType = UrlAccessType.ME;
  routeAuthenticationService.require('ROLE_USER')(req, res, function(){
    req.resourceOwner = req.user;
    next();
  });
}

RouteUserLoader.prototype.setUserInRequest = function(id,req,res,next){
  req.resourceOwnerType = UrlAccessType.USER;
  routeAuthenticationService.require('ROLE_USER')(req, res, function(){
    mongoose.model('User').findById(id, function(userError, userFromPath){
      if (userError) {
        console.log('userError',userError);
        return res.status(403).end();
      }
      if(!userFromPath){
        return res.status(404).end();
      }
      req.resourceOwner = userFromPath;
      next();
    });
  });
}

RouteUserLoader.prototype.load = function(userIdParameter){

  var self = this;

  return function(req,res,next){

    var id = req.params[userIdParameter];

    if(self.isUserGuest(id)){

      self.setGuestInRequest(req,res,next);

    } else if(self.isUserAdmin(id)){

      self.setAdminInRequest(req,res,next);

    } else if(self.isUserSelf(id)){

      self.setSelfInRequest(req,res,next);

    } else if (self.isUserParticular(id)){

      self.setUserInRequest(id,req,res,next);

    } else {
      res.status(404).end();
    }
  };
};


module.exports = exports = new RouteUserLoader();
