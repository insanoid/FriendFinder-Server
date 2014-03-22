
/**
* Module dependencies.
*/

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');

var app = express();
 

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));


// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}
app.post('/user/location/update',user.location_update);
app.post('/user/update',user.update);
app.post('/user/authenticate',user.authenticate);
app.post('/user/create',user.create);
app.get('/friends/all',user.all);
app.get('/friends/location/all',user.all_location);
app.get('/friends/location',user.friend_location);

app.get('/', function(request, response) {
  response.render("index");
});

http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});
