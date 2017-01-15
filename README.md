# watchmen: a service monitor for node.js

[![Build Status](https://secure.travis-ci.org/iloire/watchmen.png?branch=master)](http://travis-ci.org/iloire/watchmen)
[![Inline docs](http://inch-ci.org/github/iloire/watchmen.svg?branch=master)](http://inch-ci.org/github/iloire/watchmen)
[![star this repo](http://githubbadges.com/star.svg?user=HansHammel&repo=watchmen&style=flat&color=fff&background=007ec6)](https://github.com/iloire/watchmen)
[![fork this repo](http://githubbadges.com/fork.svg?user=HansHammel&repo=watchmen&style=flat&color=fff&background=007ec6)](https://github.com/iloire/watchmen/fork)
[![david dependency](https://img.shields.io/david/iloire/watchmen.svg)](https://david-dm.org/iloire/watchmen)
[![david devDependency](https://img.shields.io/david/dev/iloire/watchmen.svg)](https://david-dm.org/iloire/watchmen)
[![david optionalDependency](https://img.shields.io/david/optional/iloire/watchmen.svg)](https://david-dm.org/iloire/watchmen)
[![david peerDependency](https://img.shields.io/david/peer/iloire/watchmen.svg)](https://david-dm.org/iloire/watchmen)
[![Known Vulnerabilities](https://snyk.io/test/github/iloire/watchmen/badge.svg)](https://snyk.io/test/github/iloire/watchmen)[![NSP Status](https://nodesecurity.io/orgs/hanshammel/projects/bdaf4089-653d-4f30-a1d5-df4807577ca8/badge)](https://nodesecurity.io/orgs/hanshammel/projects/bdaf4089-653d-4f30-a1d5-df4807577ca8)
[![Code Climate](https://codeclimate.com/github/HansHammel/watchmen/badges/gpa.svg)](https://codeclimate.com/github/HansHammel/watchmen)
[![Test Coverage](https://codeclimate.com/github/HansHammel/watchmen/badges/coverage.svg)](https://codeclimate.com/github/HansHammel/watchmen/coverage)


- [What is watchmen?](#what-is-watchmen)
- [Demo](#demo)
- [Installation](#installation)
- [Running and stopping watchmen](#running-and-stopping-watchmen)
- [Development workflow](#development-workflow)
- [Managing your node processes with pm2](#managing-your-node-processes-with-pm2)
- [Managing processes with node-foreman](#managing-processes-with-node-foreman)
- [Configuration](#configuration)
- [Ping services](#ping-services)
- [Monitor plugins](#monitor-plugins)
- [Storage providers](#storage-providers)
- [Using fake data for development](#using-fake-data-for-development)
- [Running with docker](#running-with-docker)
- [Terraform scripts for digital-ocean](#terraform-scripts-for-digital-ocean)
- [Tests](#tests)
- [Debugging](#debugging)
- [Contributing](#contributing)
- [Style guide](#style-guide)
- [History](#history)
- [Donations](#donations)
- [License](#license)

## What is watchmen?

- watchmen monitors health (outages, uptime, response time warnings, avg. response time, etc) for your servers.
- **ping types are pluggable** through npm modules. At this time, `http-head` and `http-contains` are available. Read more about ping services and how to create one below.
- watchmen provides **custom actions through plugins** (console outpug, email notifications, etc).
- the code base aims to be simple and easy to understand and modify.

## Demo

Check the [web interface in action](http://watchmen-demo.letsnode.com).

![watchmen, service details](https://github.com/iloire/watchmen/raw/master/screenshots/watchmen-details-mobile-01.png)

![watchmen, service list](https://github.com/iloire/watchmen/raw/master/screenshots/watchmen-list-mobile-01.png)

![watchmen, add service](https://github.com/iloire/watchmen/raw/master/screenshots/watchmen-add.png)

![watchmen, list services](https://github.com/iloire/watchmen/raw/master/screenshots/watchmen-list-wide-01.png)


## Installation

### Requirements

Get redis from [redis.io](http://redis.io/download) and install it.

### Installing watchmen

Clone the repo by using
```bash
git clone git@github.com:iloire/watchmen.git
```
or
```bash
git clone https://github.com/iloire/watchmen.git
```

Then install the required dependencies using ``npm``
```bash
cd watchmen
npm install
```

## Running and stopping watchmen

Make sure you have `redis-server` in your `PATH`. Then you can run watchmen services:
```bash
redis-server redis.conf
node run-monitor-server.js
node run-web-server.js
```
or just start your redis server

## Development workflows

### start hacking

starts two scripts run-monitor-server.js (the bare server) and run-web-server.js (the web ui) with WATCHMEN_WEB_NO_AUTH=true (disabled login)
```bash
npm run start:dev
```

### other starting options
```bash
npm run start
npm run start:mon
npm run start:svr
```

### Fetching bower dependencies
```bash
npm run bower:install
```

### Re-building watchmen assets
```bash
npm run build
```
or
```bash
npm run build:dev
```

### Dev watch
```bash
npm run watch
```

### Running tests
```bash
npm test
```
See below for more.

## Managing your node processes with pm2

Install pm2:
```bash
npm install -g pm2
```
Configure env variables:
```bash
export WATCHMEN_WEB_PORT=8080
```
or in package.json using cross-env see "start:dev" script

Run servers:
```bash
pm2 start run-monitor-server.js
pm2 start run-web-server.js
```

Server list:
```bash
pm2 list
```

![List of pm2 services](https://github.com/iloire/watchmen/raw/master/screenshots/pm2-01.png)

## Managing processes with node-foreman

`node-foreman` can be used to run the monitor and web server as an Upstart
service. On Ubuntu systems, this allows the usage of `service watchmen start`.

Watchmen already include a `Procfile` so you can also manage with `nf`.

```bash
npm install -g foreman
nf start
```

To export as an Upstart script using the environment variables in a `.env` file:

```bash
PATH="/home/user/.nvm/versions/v5.1.0/bin:$PATH" nf export -o /etc/init -a watchmen
```

You can run this without the `-o /etc/init` flag and move the files to this
directory (or the appropriate Upstart) directory yourself. Make sure you have
the correct path to the `node` bin, you can find out with `which node`.

More documentation on `node-foreman`:

https://github.com/strongloop/node-foreman

## Configuration

Config is set through ``env`` variables.

Have a look at the /config folder for more details, but the general parameters are:

```bash
export WATCHMEN_BASE_URL='http://watchmen.letsnode.com'
export WATCHMEN_WEB_PORT='8080'
export WATCHMEN_ADMINS='admin@domain.com'
export WATCHMEN_GOOGLE_ANALYTICS_ID='your-GA-ID'
```

### Authorization settings (since 2.2.0)

Watchmen uses Google Auth through passportjs for authentication. If your google email is present in ``WATCHMEN_ADMINS`` env variable, you will be able to **manage services**.

Make sure you set the right hostname so the OAuth dance can be negociated correctly:

```bash
export WATCHMEN_BASE_URL='http://watchmen.letsnode.com/'
```

You will also need to set the Google client ID and secret using ``env`` variables accordingly. (Login into https://console.developers.google.com/ to create them first)

```bash
export WATCHMEN_GOOGLE_CLIENT_ID='<your key>'
export WATCHMEN_GOOGLE_CLIENT_SECRET='<your secret>'
```

## Disabling authentication

If you want to disable authentication access and let anyone access and edit your services use:

```bash
export WATCHMEN_WEB_NO_AUTH='true'
```

## Ping services

### Embedded ping services

#### HTTP-HEAD

https://www.npmjs.com/package/watchmen-ping-http-head

#### HTTP-CONTAINS

https://www.npmjs.com/package/watchmen-ping-http-contains

### Creating your own ping service

Ping services are npm modules with the ``'watchmen-ping'`` prefix.

For example, if you want to create a smtp ping service:

#### a) create a watchmen-ping-smtp module and publish it. This is how a simple HTTP ping service looks like:

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

#### b) npm install it in watchmen:

```bash
npm install watchmen-ping-smtp
```

#### c) create a service that uses that ping service

![Select ping service](https://github.com/iloire/watchmen/raw/master/screenshots/ping-service-selection.png)

## Monitor plugins

### AWS SES Notifications plugin (provided)

https://github.com/iloire/watchmen-plugin-aws-ses

#### Settings

```bash
export WATCHMEN_AWS_FROM='your@email'
export WATCHMEN_AWS_REGION='your AWS region'
export WATCHMEN_AWS_KEY='your AWS Key'
export WATCHMEN_AWS_SECRET='your AWS secret'

```

### Nodemailer Notifications plugin (third party contribution)

https://www.npmjs.com/package/watchmen-plugin-nodemailer

### Slack Notifications plugin (third party contribution)

https://www.npmjs.com/package/watchmen-plugin-slack

### Console output plugin (provided)

https://github.com/iloire/watchmen-plugin-console

### Creating your own custom plugin

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

## Storage providers

### Redis

#### Data schema

```
service - set with service id's
service:latestOutages - latest outages for all services
service:<serviceId> - hashMap with service details
service:<serviceId>:outages:current - current outage for a service (if any)
service:<serviceId>:outages - sorted set with outages info
service:<serviceId>:latency - sorted set with latency info
service:<serviceId>:failurecount - number of consecutive pings failures (to determine if it is an outage)
```

### Configuration

```bash
export WATCHMEN_REDIS_PORT_PRODUCTION=1216
export WATCHMEN_REDIS_DB_PRODUCTION=1

export WATCHMEN_REDIS_PORT_DEVELOPMENT=1216
export WATCHMEN_REDIS_DB_DEVELOPMENT=2
```

## Using fake data for development

```bash
cd scripts
sh populate-dummy-data-120days.sh # will populate data for a 120 day period
```

or

```bash
sh populate-dummy-data-30days.sh
```

etc..


## Running with docker

To run with docker, make sure you have docker-compose installed: https://docs.docker.com/compose/install/

Also, have a docker host running. A good way is using docker-machine with a local VM: https://docs.docker.com/machine/get-started/

Edit ``docker-compose.env`` and set up the configuration.

Then, to build and run Watchmen, run the following:

```bash
docker-compose build
docker-compose up
```

After this Watchmen webserver will be running and exposed in the port 3000 of the docker host.

To configure, please look `docker-compose.yml` and `docker-compose.env`.

## Terraform scripts for digital-ocean

You can deploy watchmen in a Digital Ocean droplet in a matter of minutes.

1. Install terraform from [terraform.io](https://www.terraform.io/).
2. If you don't have one yet, create an account in Digital Ocean. Use [this link](https://m.do.co/c/23602cbcfcc3) to get an initial $10 credit so you can play around with it for free.
3. Open a terminal in ``terraform/digital-ocean``
4. Fill up ``user-data.yml`` with your configuration. Don't forget to also setup ``DIGITALOCEAN_TOKEN`` and ``SSH_FINGERPRINT`` env variables (see apply.sh):
5. Run ``sh apply.sh`` to create your droplet.

Terraform will create a droplet based on Ubuntu with the necessary packages, compile nodejs from source, install a redis server, install and configure an nginx in front of watchmen, and setup and run watchmen from the latest master using [pm2](https://github.com/Unitech/pm2).

![watchmen droplet](https://github.com/iloire/watchmen/raw/master/screenshots/watchmen-droplet-01.png)

## Tests

```bash
$ npm test
```

### Test coverage

```bash
$ npm run coverage
```

Then check the coverage reports:

```bash
$ open coverage/lcov-report/lib/index.html
```

![watchmen test coverage](https://github.com/iloire/watchmen/raw/master/screenshots/test-coverage-node-01.png)

## Debugging

watchmen uses [debug](https://www.npmjs.com/package/debug)

```bash
set DEBUG=*
```

## Contributing

You can contribute by:

- Addressing one if the items on the TODO list or one of the open issues.
- Creating monitor plugins.
- Creating ping services.
- Reporting bugs.

### Contributors

- [Iván Loire](http://twitter.com/ivanloire)
- [Oden](https://github.com/Odenius)
- [Tom Atkinson](https://github.com/Nibbler999)
- [Martin Bučko](https://github.com/MartinBucko)
- [Eric Elliott](https://github.com/ericelliott)
- [Dan Abramov](https://twitter.com/dan_abramov)
- [Vaios Karampinis](https://github.com/vkarampinis)
- [Emily Horsman](https://github.com/emilyhorsman)
- [Luís Bianchin](https://github.com/labianchin)
- [Marcus Kida](https://github.com/kimar)
- [Adriano Emerick Cola](https://github.com/adrianocola)

## Style guide

Please use [semantic commit messages](http://seesparkbox.com/foundry/semantic_commit_messages)

## History

**3.4.0**

- Add non authenticated access
- Add redis-store for session persistence

**3.3.1**

- Fixed redis sorted set member uniqueness (zadd). Thanks Adriano Emerick Cola!
- Add terraform for digital ocean

**3.3.0**

- Add docker-compose

**3.2.0**

- Add collapsed nav-bar in mobile.
- Mobile friendly admin buttons.
- Move services menu to sidebar.
- Add support for node foreman.
- Request avatar with the current URL scheme.
- Fix package.json loading when using node >= 5.x
- Other minor fixes and optimisations.

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

## TODO

- Use a beautiful template, like [the Gentella Admin Bootstrap Theme](http://demo.kimlabs.com/gentelella/production/index.html).
- Regular expressions support in the ``http-contains`` plugin.
- Define a data expiration period (per service)
- Handle auth in ping services.

## Third party attribution

- Bootstrap - http://getbootstrap.com/
- "Font Awesome by Dave Gandy - http://fortawesome.github.com/Font-Awesome"
- C3 charts - http://c3js.org/
- ngTable - http://ng-table.com/

(see package.json and bower.json for a complete list of libraries and dependencies)

## Donations

You can buy me a beer by sending BTC at 1DQRybRW7cQtRq65qCxkpGNLX9BVjmfJaY.

Yeah, it turns out researchers have uncovered that beer release endorphins in our brain that we use as a reward and motivation for coding on open source projects.

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
