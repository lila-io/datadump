var datasource = require('../server/conf/datasource');
var fs = require('fs');
var path = require('path');
var Q = require('q');
var test_schema = path.join(__dirname,'../server/models','test_schema.txt');

/**
 * Parse schema file and execute queries one by one
 * against connected Cassandra cluster.
 * Shut down afterwards and reinitialize client
 * with test keyspace name, so that queries work.
 */
function setupTestSchema(callback){

  var cass = new datasource.Cassandra({contactPoints:['localhost'],keyspace:null});

  cass.getClient().connect(function(err, result) {
    if(err){
      throw new Error('Could not connect to Cassandra', err);
    }
    console.log('[%d] Connected to cassandra',process.pid);

    // parse contents
    var text = fs.readFileSync(test_schema,{encoding:'utf8'});

    // remove new lines
    var trimmed_text = text.replace(/(\r\n|\n|\r)/gm,"");

    // split queries as does not work when batched
    var queries = trimmed_text.split(';');

    var tasks = [];

    queries.forEach(function(query,idx){

      if(!query || !query.trim()) return;

      var fn = function(){
        var deferred = Q.defer();
        console.log("promise started",idx)
        console.log("query",query)
        cass.getClient().execute( query, null, null, function(err, res){
          console.log("promise finished",idx)
          if(err){
            deferred.reject(err);
          } else {
            deferred.resolve(res);
          }
        });
        return deferred.promise;
      }

      tasks.push(fn);

    });

    console.log(tasks)

    var allTasksPromise = tasks.reduce(function (soFar, f) {
      return soFar.then(f);
    }, Q(function(){ return true; }));

    allTasksPromise.then(function(){
      cass.disconnect(callback)
    }).done();
  });
}

setupTestSchema(function(){
  process.exit(0);
});
