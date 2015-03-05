var express = require('express'),
  app = express(),
	favicon = require('serve-favicon'),
	bodyParser = require('body-parser'),
	compress = require('compression'),
	logger = require('morgan'),
	serveStatic = require('serve-static'),
	ejs = require('ejs'),
	path = require('path'),
	config = require('./server/conf/config'),
	mappings = require('./server/conf/mappings'),
  datasource = require('./server/conf/datasource'),
  models = require('./server/models/index'),
  authentication = require('./server/conf/authentication'),
  bootstrap = require('./server/conf/bootstrap'),
  q = require('q')
;

// CONFIGURE APP
////////////////////////////////

app.disable('x-powered-by');
app.set('port', config.port);
app.set('views', __dirname + config.staticFilesDir);
app.engine('.html', ejs.__express);
app.set('view engine', 'html');
app.use(favicon( path.join( __dirname, config.staticFilesDir, 'favicon.ico'), { maxAge: config.expires.year } ));
if(app.get('env') === 'development' || app.get('env') === 'test'){
  app.use(logger('dev'));
} else if(app.get('env') === 'production') {
  app.use(logger('combined', {
    // remove status codes below 400 from log
    skip: function (req, res) { return res.statusCode < 400 }
  }));
}
// compress response with zlib if required
app.use(compress());
// accept request with json payloads
app.use(bodyParser.json());
// handle static files TODO: switch to nginx in production
app.use( serveStatic( path.join(__dirname, config.staticFilesDir), { maxAge: config.expires.year } ));

// Set up globals for views
////////////////////////////////////////////////////////

app.locals.user = {};
app.locals.errors = [];
app.locals.oauthTwitter = !!config.oauth.twitter.key;
app.locals.oauthGitHub = !!config.oauth.github.key;
app.locals.oauthFacebook = !!config.oauth.facebook.key;
app.locals.oauthGoogle = !!config.oauth.google.key;
app.locals.target = '';


// Initialize db
datasource.init(app)

// Initialize models
.then(function(){ return q(models.init()) })

// Set up passport(authentication) module
.then(function(){ return q(authentication.init(app)) })

// Setup routes
.then(function(){ return q(mappings.init(app)) })

// Run bootstrap
.then(function(){ return bootstrap.init(); })

// Finally run the app
.done( function(){
  app.listen(app.get('port'), function () {
    'use strict';
    console.log('\n');
    console.log('+--------------------------');
    console.log(' Environment ' + app.get('env'));
    console.log(' Listening on port ' + app.get('port'));
    console.log('+--------------------------');
  });
});

