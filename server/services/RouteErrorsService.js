'use strict';

function RouteErrors(){}

RouteErrors.prototype.sendNotFound = function(){
  return function(req,res){
    res.status(404);
    if (req.accepts('html')) {
      res.render('404.html');
      return;
    }
    if (req.accepts('json')) {
      res.send({ error : 'Not found' });
      return;
    }
    res.type('txt').send('Not found');
  };
}

RouteErrors.prototype.catchServerErrors = function(){
  return function(err,req,res) {
    console.log([
        'ERROR: ' + (err.status || 500),
        'TIME: ' + (new Date()),
        'URL: ' + req.url,
        'QUERY: ' + JSON.stringify(req.query),
        'STACK: ' + err.stack
      ].join('; ')
    );

    res.status(err.status || 500);
    res.render('500.html', {
      status: err.status || 500,
      error: err
    });
  };
}

module.exports = exports = new RouteErrors();
