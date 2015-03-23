var
  should = require('should'),
  request = require('superagent'),
  exec = require('child_process').exec,
  MongoClient = require('mongodb').MongoClient,
  q = require('q')
  ;

exports.startServer = function(cb){

  var child;

  if('function' !== typeof cb)
    throw new Error('Callback must be specified')

  child = exec('echo $PATH && node server', {env:{NODE_ENV:'test'}},function (error, stdout, stderr) {
    console.log('error: ' + error);
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
  });



  child.stdout.on('data', function(data) {
    if( /Listening on port 8080/.test(data) ){
      cb(child);
    } else {
      console.log(">>>> data: ",data)
    }
  });

  child.stdout.on('error', function(data) {
    console.error(">>>> error: ",data)
  });

  setTimeout(function(){
    if(child) child.kill();
  },60000);
};

exports.stopServer = function(process, cb){

  if('function' !== typeof cb)
    throw new Error('Callback must be specified')

  if(process)
    process.kill();

  cb();
};

exports.prepareBuckets = function(cache){
  'use strict';
  var usernames = ['user', 'jane', 'tom', 'billy', 'superadmin'];
  var operations = [];

  usernames.forEach(function(username){
    operations.push(exports.setupUserData(username, cache))
  });

  return q.all(operations);
}

exports.dropBuckets = function(){
  'use strict';
  var usernames = ['user', 'jane', 'tom', 'billy', 'superadmin'];
  var operations = [];

  usernames.forEach(function(username){
    operations.push(exports.dropUserData(username))
  });

  return q.all(operations);
}

exports.cleanupRestrictions = function(){
  'use strict';
  var deferred = q.defer();
  MongoClient.connect('mongodb://localhost/test_db', function(err, db) {
    if(err) return deferred.reject(err);
    db.collection('datadump_login_attempt').drop();
    deferred.resolve();
    db.close();
  });
  return deferred.promise;
}

exports.getUserToken = function(){
  'use strict';
  var deferred = q.defer();
  request
    .post('http://localhost:8080/api/auth/login')
    .send({ username: 'user', password: 'user' })
    .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
    .end(function(err, res){
      should.not.exist(err);
      should.exist(res.body.token);
      res.status.should.eql(200);
      deferred.resolve(res.body.token);
    });
  return deferred.promise;
}

exports.getAdminToken = function(){
  'use strict';
  var deferred = q.defer();
  request
    .post('http://localhost:8080/api/auth/login')
    .send({ username: 'superadmin', password: 'superadmin' })
    .set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
    .end(function(err, res){
      should.not.exist(err);
      should.exist(res.body.token);
      res.status.should.eql(200);
      deferred.resolve(res.body.token);
    });
  return deferred.promise;
}

exports.bearerFromToken = function(t){
  return 'Bearer ' + t;
}

exports.findUser = function(username){
  var deferred = q.defer();

  MongoClient.connect('mongodb://localhost/test_db', function(err, db) {
    if(err) return deferred.reject(err);
    var user = db.collection('datadump_user');
    var pattern = new RegExp('^'+username+'$');

    user.find({username:pattern}).toArray(function(err,users){
      if(users && users.length > 1)
        deferred.reject('Too many users found');
      else if(users && users.length == 1)
        deferred.resolve(users[0]);
      else
        deferred.resolve(null);

      db.close();
    })
  });
  return deferred.promise;
}

exports.findUserBuckets = function(userId){
  var deferred = q.defer();

  MongoClient.connect('mongodb://localhost/test_db', function(err, db) {
    if(err) return deferred.reject(err);
    var bucket = db.collection('datadump_bucket');

    bucket.find({user:userId}).toArray(function(err,buckets){
      if(buckets)
        deferred.resolve(buckets);
      else
        deferred.resolve(null);

      db.close();
    })
  });
  return deferred.promise;
}

exports.saveBucket = function(data){
  var deferred = q.defer();
  MongoClient.connect('mongodb://localhost/test_db', function(err, db) {
    if(err) return deferred.reject(err);
    var bucket = db.collection('datadump_bucket');
    bucket.insertOne(data,function(err,result){
      if(err)
        deferred.reject(err);
      else
        deferred.resolve(result.ops[0]);

      db.close();
    })
  });
  return deferred.promise;
}

exports.deleteBucket = function(bucketId){
  var deferred = q.defer();
  MongoClient.connect('mongodb://localhost/test_db', function(err, db) {
    if(err) return deferred.reject(err);
    var bucket = db.collection('datadump_bucket');
    bucket.deleteOne({_id:bucketId},function(err,result){
      if(err)
        deferred.reject(err);
      else
        deferred.resolve();

      db.close();
    })
  });
  return deferred.promise;
}

exports.setupUserData = function(username, cache){
  return exports.findUser(username)
    .then(function(u){
      cache[username] = {};
      cache[username].user = u;
      return exports.setupUserBuckets(u);
    }).then(function(buckets){
      cache[username].publicBucket = buckets[0];
      cache[username].privateBucket = buckets[1];
    })
}

exports.dropUserData = function(username, cache){
  return exports.findUser(username)
    .then(function(u){
      return exports.dropUserBuckets(u);
    })
}

exports.setupUserBuckets = function(user){
  return q.all([
    exports.saveBucket({
      user:user._id,
      description:'public bucket',
      path:'user-specific-public-path',
      isPublic: true
    }),
    exports.saveBucket({
      user:user._id,
      description:'private bucket',
      path:'user-specific-private-path',
      isPublic: false
    })
  ])
}

exports.dropUserBuckets = function(user){
  return exports.findUserBuckets(user._id).then(function(buckets){
    var deleteOperations = [];
    buckets.forEach(function(bucket){
      deleteOperations.push(exports.deleteBucket(bucket._id))
    });
    return q.all(deleteOperations);
  })
}
