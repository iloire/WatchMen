var express = require('express');
var watchmen = require('../lib/watchmen');
var app = express();
var storage_factory = require ('../lib/storage/storage_factory');
var storage = storage_factory.get_storage_instance();
var moment = require ('moment');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var errorHandler = require('errorhandler');
var expressLayouts = require('express-ejs-layouts');
var env = process.env.NODE_ENV || 'development';

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.set('layout', 'layout.html');

//register .html extension with ejs view render
app.engine('.html', require('ejs').renderFile);
app.use(expressLayouts);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(methodOverride());

//-----------------------------------------
// Import routes
//-----------------------------------------
require('./routes/reporting').add_routes(app, storage);

require('express-dynamic-helpers-patch')(app);

var helpers = {
    dateformat : function (req, res) {
    return function (date, format) {
      if (format==='ago'){
        return moment(date).fromNow();
      }
      else if (format==='timespan'){
        return moment(date).fromNow(true);
      }
      else{
        return moment(date).format(format || 'MMM D YYYY, hh:mm');
      }
    };
  }
};

app.dynamicHelpers(helpers);

app.use(express.static(__dirname + '/public'));

if (env === 'development') {
  app.use(errorHandler({ dumpExceptions: true, showStack: true }));
}

if (env === 'development') {
  app.use(errorHandler());
}


//-----------------------------------------
// Start server
//-----------------------------------------
var port = parseInt(process.argv[2], 10) || 3000;
var server = app.listen(port, function () {

  if (server.address()) {
    console.log("watchmen server listening on port %d in %s mode", port, app.settings.env);
  } else {
    console.log ('something went wrong... couldn\'t listen to that port.');
  }

  process.on('SIGINT', function () {
    console.log('stopping web server.. bye!');

    // Let connections drain...
    server.close(function () {
      process.exit(0);
    });

    // Kill it anyway if it stalls.
    setTimeout(function () {
      process.exit(0);
    },500);
  });
});
