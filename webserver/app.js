var express = require('express');
var watchmen = require('../lib/watchmen');
var app = express.createServer();
var storage_factory = require ('../lib/storage/storage_factory');
var storage = storage_factory.get_storage_instance();
var moment = require ('moment');

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.register('.html', require("ejs")); //register .html extension with ejs view render
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

//-----------------------------------------
// Import routes
//-----------------------------------------
require('./routes/reporting').add_routes(app, storage);

var helpers = {
    dateformat : function (req, res) {
    return function (date, format) {
      if (format==='ago'){
        return moment(date).fromNow();
      }
      else{
        return moment(date).format(format || 'MMM D YYYY, hh:mm');
      }
    };
  }
};

app.dynamicHelpers(helpers);

//-----------------------------------------
// Start server
//-----------------------------------------
var port = parseInt(process.argv[2], 10) || 3000;
app.listen(port);
if (app.address())
	console.log("watchmen server listening on port %d in %s mode", app.address().port, app.settings.env);
else
	console.log ('something went wrong... couldn\'t listen to that port.');

process.on('SIGINT', function () {
	console.log('stopping web server.. bye!');
	process.exit(0);
});