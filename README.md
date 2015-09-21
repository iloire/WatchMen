# watchmen: a service monitor for node.js

[![Build Status](https://secure.travis-ci.org/iloire/watchmen.png?branch=master)](http://travis-ci.org/iloire/watchmen)

- watchmen monitors health (outages, uptime, response time warnings, avg. response time, etc) for your servers.
- **ping types are pluggable** through npm modules. At this time, `http-head` and `http-contains` are available. Read more about ping services and how to create one below.
- watchmen provides **custom actions through plugins** (console outpug, email notifications, etc).
- the code base aims to be simple and easy to understand and modify.

# Demo

Check the [web interface in action](http://watchmen.letsnode.com/services).

![watchmen, service details](https://github.com/iloire/watchmen/raw/master/screenshots/watchmen-details-mobile-01.png)

![watchmen, service list](https://github.com/iloire/watchmen/raw/master/screenshots/watchmen-list-mobile-01.png)

![watchmen, add service](https://github.com/iloire/watchmen/raw/master/screenshots/watchmen-add.png)

![watchmen, list services](https://github.com/iloire/watchmen/raw/master/screenshots/watchmen-list-wide-01.png)



# Installation

## Requirements

Make sure bower is installed globally:

    $ npm install -g bower

Get redis from [redis.io](http://redis.io/download) and install it.

## Install watchmen

    git clone https://github.com/iloire/watchmen.git
    cd WatchMen

    $ npm install

# Running and stopping watchmen

Make sure you have `redis-server` in your `PATH`. Then you can run watchmen services:

    $ redis-server redis.conf
    $ node run-monitor-server.js
    $ node run-web-server.js

## Managing your node processes with pm2

Install pm2:

    $ npm install -g pm2

Configure env variables:

    $ export WATCHMEN_WEB_PORT=8080

Run servers:

    $ pm2 start run-monitor-server.js
    $ pm2 start run-web-server.js

Server list:

    $ pm2 list

![List of pm2 services](https://github.com/iloire/watchmen/raw/master/screenshots/pm2-01.png)

## Configuration

Config is set through ``env`` variables.

Have a look at the /config folder for more details, but the general parameters are:

```sh
export WATCHMEN_BASE_URL='http://watchmen.letsnode.com'
export WATCHMEN_WEB_PORT='8080'
export WATCHMEN_ADMINS='admin@domain.com'
export WATCHMEN_GOOGLE_ANALYTICS_ID='your-GA-ID'
```

### Authorization settings (since 2.2.0)

Watchmen uses Google Auth through passportjs for authentication. If your google email is present in ``WATCHMEN_ADMINS`` env variable, you will be able to **manage services**.

Make sure you set the right hostname so the OAuth dance can be negociated correctly:

```sh
export WATCHMEN_BASE_URL='http://watchmen.letsnode.com/'
```

You will also need to set the Google client ID and secret using ``env`` variables accordingly. (Login into https://console.developers.google.com/ to create them first)

```sh
export WATCHMEN_GOOGLE_CLIENT_ID='<your key>'
export WATCHMEN_GOOGLE_CLIENT_SECRET='<your secret>'
```

### Ping services


#### Embedded ping services

##### HTTP-HEAD

https://www.npmjs.com/package/watchmen-ping-http-head

##### HTTP-CONTAINS

https://www.npmjs.com/package/watchmen-ping-http-contains

#### Creating your own ping service

Ping services are npm modules with the ``'watchmen-ping'`` prefix.

For example, if you want to create a smtp ping service:

##### a) create a watchmen-ping-smtp module and publish it. This is how a simple HTTP ping service looks like:

```javascript
var request = require('request');

function PingService(){}

exports = module.exports = PingService;

PingService.prototype.ping = function(service, callback){
  var startTime = +new Date();
  request.get({ method: 'HEAD', uri: service.url }, function(error, response, body){
    callback(error, body, response, +new Date() - startTime);
  });
};

PingService.prototype.getDefaultOptions = function(){
  return {}; // there is not need for UI confi options for this ping service
}
```

##### b) npm install it in watchmen:

```sh
     npm install watchmen-ping-smtp
```

##### c) create a service that uses that ping service

![Select ping service](https://github.com/iloire/watchmen/raw/master/screenshots/ping-service-selection.png)

### Monitor plugins

#### AWS SES Notifications

https://github.com/iloire/watchmen-plugin-aws-ses

##### Settings

```sh
export WATCHMEN_AWS_FROM='your@email'
export WATCHMEN_AWS_REGION='your AWS region'
export WATCHMEN_AWS_KEY='your AWS Key'
export WATCHMEN_AWS_SECRET='your AWS secret'

```

#### Console output

https://github.com/iloire/watchmen-plugin-console


#### Creating your own plugin

A ``watchmen`` instance will be injected through your plugin constructor. Then you can subscribe to the desired events. Best is to show it through an example.

This what the console plugin looks like:

```javascript
var colors = require('colors');
var moment = require('moment');

var eventHandlers = {

  /**
   * On a new outage
   * @param {Object} service
   * @param {Object} outage
   * @param {Object} outage.error check error
   * @param {number} outage.timestamp outage timestamp
   */

  onNewOutage: function (service, outage) {
    var errorMsg = service.name + ' down!'.red + '. Error: ' + JSON.stringify(outage.error).red;
    console.log(errorMsg);
  },

  /**
   * Failed ping on an existing outage
   * @param {Object} service
   * @param {Object} outage
   * @param {Object} outage.error check error
   * @param {number} outage.timestamp outage timestamp
   */

  onCurrentOutage: function (service, outage) {
    var errorMsg = service.name + ' is still down!'.red + '. Error: ' + JSON.stringify(outage.error).red;
    console.log(errorMsg);
  },

  /**
   * Failed check (it will be an outage or not according to service.failuresToBeOutage
   * @param {Object} service
   * @param {Object} data
   * @param {Object} data.error check error
   * @param {number} data.currentFailureCount number of consecutive check failures
   */

  onFailedCheck: function (service, data) {
    var errorMsg = service.name + ' check failed!'.red + '. Error: ' + JSON.stringify(data.error).red;
    console.log(errorMsg);
  },

  /**
   * Warning alert
   * @param {Object} service
   * @param {Object} data
   * @param {number} data.elapsedTime (ms)
   */

  onLatencyWarning: function (service, data) {
    var msg = service.name + ' latency warning'.yellow + '. Took: ' + (data.elapsedTime + ' ms.').yellow;
    console.log(msg);
  },

  /**
   * Service is back online
   * @param {Object} service
   * @param {Object} lastOutage
   * @param {Object} lastOutage.error
   * @param {number} lastOutage.timestamp (ms)
   */

  onServiceBack: function (service, lastOutage) {
    var duration = moment.duration(+new Date() - lastOutage.timestamp, 'seconds');
    console.log(service.name.white + ' is back'.green + '. Down for '.gray + duration.humanize().white);
  },

  /**
   * Service is responding correctly
   * @param {Object} service
   * @param {Object} data
   * @param {number} data.elapsedTime (ms)
   */

  onServiceOk: function (service, data) {
    var serviceOkMsg = service.name + ' responded ' + 'OK!'.green;
    var responseTimeMsg = data.elapsedTime + ' ms.';
    console.log(serviceOkMsg, responseTimeMsg.gray);
  }
};

function ConsolePlugin(watchmen) {
  watchmen.on('new-outage', eventHandlers.onNewOutage);
  watchmen.on('current-outage', eventHandlers.onCurrentOutage);
  watchmen.on('service-error', eventHandlers.onFailedCheck);

  watchmen.on('latency-warning', eventHandlers.onLatencyWarning);
  watchmen.on('service-back', eventHandlers.onServiceBack);
  watchmen.on('service-ok', eventHandlers.onServiceOk);
}

exports = module.exports = ConsolePlugin;
```

### Storage providers

#### Redis

##### Data schema

```
service - set with service id's
service:latestOutages - latest outages for all services
service:<serviceId> - hashMap with service details
service:<serviceId>:outages:current - current outage for a service (if any)
service:<serviceId>:outages - sorted set with outages info
service:<serviceId>:latency - sorted set with latency info
service:<serviceId>:failurecount - number of consecutive pings failures (to determine if it is an outage)
```

##### Configuration

```sh
export WATCHMEN_REDIS_PORT_PRODUCTION=1216
export WATCHMEN_REDIS_DB_PRODUCTION=1

export WATCHMEN_REDIS_PORT_DEVELOPMENT=1216
export WATCHMEN_REDIS_DB_DEVELOPMENT=2
```


### Using fake data for development

```sh
cd scripts
sh populate-dummy-data-120days.sh # will populate data for a 120 day period
```

or

```sh
sh populate-dummy-data-30days.sh
```

etc..


## Tests

```sh
$ npm test
```

### Test coverage

```sh
$ npm run coverage
```

Then check the coverage reports:

```sh
$ open coverage/lcov-report/lib/index.html
```

![watchmen test coverage](https://github.com/iloire/watchmen/raw/master/screenshots/test-coverage-node-01.png)

## Debugging

watchmen uses [debug](https://www.npmjs.com/package/debug)

```sh
set DEBUG=*
```

## TODO

 - Define a data expiration period (per service)
 - Handle auth in ping services.

## Contributions

You can contribute by:

- Addressing one if the items on the TODO list or one of the open issues.
- Creating monitor plugins.
- Creating ping services.
- Reporting bugs.

## History

**3.1.0**

- Only notify on sustained outages in-progress (new ``service.failureThreshold`` property).
- Introduce a new "service-error" event that gets triggered when a ping fails.

**3.0.0**

- Watchmen monitor has been refactored. **There is not backwards compatibility with previous watchmen databases.**
- Pluggable ping services as separate npm modules (http-head and http contains included).
- Plugins for watchmen monitor as separate npm modules (console and AWS SES Notifications included).
- Services are persisted in the database.
- UI panel to add/edit/delete/reset services.
- Store latency points. Latency charts.
- Restricted services to users (by email). Login with Google Auth to access those.

**2.5.0**

- Rewrite notification system (support for postmark and AWS-SES - it is easy to add new ones).
- Add 'alwaysAlertTo' to notifications.
- Refactor configuration files. IMPORTANT: Please update your configuration files if you are upgrading (host/service config is still the same)!
- Use postmark module instead of custom code for talking to postmark service.
- Add istanbul for test coverage.
- Fix: Cancel timeout to avoid hammering the server when the controller gets called multiple times.
- Add colors to server console output.

**2.4.0**

- Frontend revamp using angularjs.
- Client side pagination using ngTable.
- Client dependencies now managed by bower.
- Extract analytics ID to config.

**2.3.0**

- Use passport-google-oauth2 as Google authentication strategy.

**2.2.0**

- Added service/host authorization with passportjs and GoogleStrategy.

**2.1.0**

- Fix issue #7. Make load_services async so eventually services can be fetched form a database or remote server.

**2.0.0**

- Upgrade to Express 4 (requires Node 0.10 or later), hence bumping to 2.x.
- Bump ejs
- Remove dynamic helpers

**1.1.1**

- Persist table sorting options in localStorage.
- Improve styling and responsiveness.
- General code cleanup.
- Display date of oldest event stored in the database in details view.
- Bump redis, moment and ejs.
- Some other minor changes.

**1.1.0**

- Delete events older than a certain threshold (configurable in a per-host basis)
- Bump jQuery to 1.11.1
- Bump Handlebars to 2.0.0
- Bump bootstrap to 3.2.0
- Responsive design based on bootstrap

**1.0.alpha1 Major changes and improvements**

- **Storages** are now pluggable. `redis` storage is used by default but you can create your own : `couchdb`, `mongodb`, text file, etc (see lib/storage).
- **Ping services** are also pluggable now. So far you can use `http` and `smtp` (`smtp` is just checking tcp connection right now). You can create your own or improve the existent ones easily.
- Watchmen daemon now inherits from `events.EventEmitter`, so you can instanciate it and subscribe to the events of your choice (service_error, service_back, etc) to implement your custom logic (see server.js).
- [Knockout.js](http://knockoutjs.com) has been removed. Watchmen uses handlebars now instead. Faster, simpler code, and avoids some client side memory leacks.
- Client side is using [moment.js](http://momentjs.com) for rendering dates.
- [Express.js](http://expressjs.com) routes now are handled on /routes
- [Mocha](visionmedia.github.com/mocha/ ) is used for unit testing. Mocked storages and ping services are used.
- Configuration is now spread in separate files, under the /config directory
- Better reporting web interface. **Uptime statistics**. Outages count, warnings count.

**0.9**

- Major refactor, improved performance.
- Added tests and mocked objects for testing.
- Separate files for request, utils and watchmen library.

**0.8**

- Removed logging to file.
- Bug fixing when storing event. Needed to add port to redis key to make it unique.
- Added callback when sending email to registered problems in delivery.

**0.7**

- **Targets node 0.6.x**
- Added [knockoutjs](http://knockoutjs.com) for view model binding.
- Auto **async refresh** main page.
- **Filter** by name in main page.
- Added counter (hosts up and down).
- UI Improvements.
- Tablesorter sorts status and time tags.
- Added Google Analytics.

**0.6**

- Added current status info (site is up or down) to database.
- Added icons to display status (disable, error or ok).
- TableSorter jQuery plugin orders by status by default.

**0.5**

- Added expiration time to event records.
- Stores avg response time for each url.
- Warns if response time > limit.
- Multiple recipients in notifications.
- Removed "retry_in" option. Watchmen works in a smarter way now.
- REDIS backend.
- **Web UI to display reports** (express.js app using REDIS backend).

**0.4**

- Be able to disable entries in config file at url level
- When site is back, displays and logs information about how long the site has been down.

**0.3**

- Logs "site down" and "site back up" messages to a file (logs in a different file per host)
- Fix bug when reading url_conf.attempts on site back.

**0.2**

- Allow POST method (for testing forms).
- Added Marak/colors.js to output success and error messages.
- Displays request duration time.
- Refactoring.

**0.1**

- First release.

## Contributors

- [Iván Loire](http://twitter.com/ivanloire)
- [Oden](https://github.com/Odenius)
- [Tom Atkinson](https://github.com/Nibbler999)
- [Martin Bučko](https://github.com/MartinBucko)
- [Eric Elliott](https://github.com/ericelliott)

## TODO

- Event pagination in service details
- Twitter integration (pipe events to a twitter account)
- Security (authentication for accesing the web UI and or editing stuff)
- Google charts
- Change configuration from control panel
- Reset stats from control panel
- Regular expressions support
- Reset warning and error counter according to event expiration.

## Third party attribution

- Bootstrap - http://getbootstrap.com/
- "Font Awesome by Dave Gandy - http://fortawesome.github.com/Font-Awesome"
- C3 charts - http://c3js.org/
- ngTable - http://ng-table.com/

(see package.json and bower.json for a complete list of libraries and dependencies)

## License

Copyright (c) 2012 - 2015 Iván Loire

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
