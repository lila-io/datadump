var UrlAccessType = require('../lib/UrlAccessType');

function RoutePathAccess() {}

RoutePathAccess.prototype.isAnonymous = function (u){
  return !!(!u || !u._id);
}

RoutePathAccess.prototype.isUser = function (u){
  return !this.isAnonymous(u);
}

RoutePathAccess.prototype.isAdmin = function (u){
  return !!(this.isUser(u) && u.isAdmin);
}

RoutePathAccess.prototype.isSelf = function (authUser,item){
  if(this.isUser(authUser) && item != null && this.isUser(item.user))
    return authUser._id === item.user._id;
  else if(this.isUser(authUser) && item != null && !this.isUser(item.user))
    return (authUser._id + '') === (item.user + '');
  return false;
}

RoutePathAccess.prototype.isOwnPath = function (authUser,pathUser){
  if(this.isUser(authUser) && this.isUser(pathUser))
    return authUser._id + '' === pathUser._id + '';
  return false;
}

RoutePathAccess.prototype.hasPathAccess = function (authUser,pathUser){
  if( this.isUser(authUser) && this.isUser(pathUser) && (this.isAdmin(authUser) || this.isOwnPath(authUser,pathUser) ) )
    return true;
  return false;
}

RoutePathAccess.prototype.isResourceHidden = function (authUser,pathUserType,item){
  if(!item) return true;
  else if(item.isPublic) return false;
  else if( pathUserType === UrlAccessType.GUEST ) return true;
  else if( pathUserType === UrlAccessType.ME && !this.isSelf(authUser,item) ) return true;
  else return false;
}

RoutePathAccess.prototype.hasAccess = function (authUser,pathUserType,item){

  /* jshint maxcomplexity:10 */

  if(!item) return false;
  else if(item.isPublic) return true;
  else if(this.isAdmin(authUser)) return true;
  else if( this.isSelf(authUser,item) && (pathUserType === UrlAccessType.ME || pathUserType === UrlAccessType.USER) )
    return true;
  else return false;
}

RoutePathAccess.prototype.resourceOwnerExists = function (req){
  return req && this.isUser(req.resourceOwner)
}

RoutePathAccess.prototype.resourceOwnerId = function (req){
  if(this.resourceOwnerExists(req))
    return req.resourceOwner._id;

  throw new Error('Make sure resource owner is set before calling this')
}

RoutePathAccess.prototype.hasAccessToList = function (req){
   return this.isAdmin(req.user) ||
   (this.isUser(req.user) && !this.isAdmin(req.user) &&
     (req.resourceOwnerType === UrlAccessType.GUEST ||
        req.resourceOwnerType === UrlAccessType.ME ||
        req.resourceOwnerType === UrlAccessType.USER)) ||
   (this.isAnonymous(req.user) && req.resourceOwnerType === UrlAccessType.GUEST)
}

RoutePathAccess.prototype.requiresPublicList = function (req){
  return !!(
    !this.hasAccessToList(req) ||
    req.resourceOwnerType === UrlAccessType.GUEST ||
    (( this.isUser(req.user) && !this.isAdmin(req.user) ) && req.resourceOwnerType === UrlAccessType.USER && !this.isOwnPath(req.user,req.resourceOwner))
  )
}

RoutePathAccess.prototype.requiresResourceOwnerIdForOne = function (req){
  return !(this.isAdmin(req.user) ||
    req.resourceOwnerType === UrlAccessType.GUEST ||
    req.resourceOwnerType === UrlAccessType.ADMIN
  )
}

RoutePathAccess.prototype.requiresResourceOwnerIdForList = function (req){
  return req.resourceOwnerType !== UrlAccessType.GUEST && req.resourceOwnerType !== UrlAccessType.ADMIN
}

RoutePathAccess.prototype.canAccessModifyResourcePath = function (req){
  return this.isAdmin(req.user) ||
    (req.resourceOwnerType !== UrlAccessType.ADMIN && this.isOwnPath(req.user,req.resourceOwner));
}

RoutePathAccess.prototype.canModifyResource = function (req,resource){
  req = req || {};
  return !!(this.isAdmin(req.user) || ( this.isUser(req.user) && (resource.user._id === req.user._id) ))
}

module.exports = new RoutePathAccess();
