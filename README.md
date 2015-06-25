# "watchmen", a service monitor for node.js

[![Build Status](https://secure.travis-ci.org/iloire/WatchMen.png?branch=1.x)](http://travis-ci.org/iloire/WatchMen)

- monitor service health (outages, uptime, response time warnings, avg. response time, etc) in your servers (`http`, `smtp`, etc).
- use the database of your choice. Data **storages are pluggable**. At this time, only [redis](http://redis.io) storage is available, but it is pretty easy to create and plug your own. There are plans to support `couchdb` and `mongodb` in the short term.
- **ping types are pluggable**. At this time, `http` (includes `https`) and `smtp` (tcp connection check) are available.
- watchmen provides **customizable notifications** if service is down, the response time is over a predefined limit, etc..
- the code base aims to be small, simple and easy to understand and modify.

Check out this [blog post about watchmen](http://letsnode.com/example-of-what-node-is-really-good-at)

# Demo

Check the **web interface** in action: [watchmen.letsnode.com](http://watchmen.letsnode.com).

![List of hosts](https://github.com/iloire/WatchMen/raw/1.x/screenshots/watchmen-01.png)

# Installation

## Requirements

Install first bower and redis store:

    $ npm install -g bower

[http://redis.io/download](Download redis from here)


## Install watchmen

This command will install both npm and bower dependencies

    $ npm install

# Running and stopping watchmen

Make sure you have `redis-server` in your `PATH`

    $ npm start
    $ npm stop

Or if you want to run the services separately:

    $ redis-server redis.conf
    $ node server.js
    $ node webserver/app.js

## Configuration

### a) Define hosts and services to be monitored:

You need at least one service for each host. Define the ping service type for each host or service.

Most of the properties can be defined either at host or service level. Service level properties will be prioritized.

```js
//-------------------
//config/hosts.js
//-------------------

//example of http ping for a host with 2 url's
{
  name:'letsnode blog',
  host: 'letsnode.com',
  port:80,
  ping_interval: one_minute, //set ping interval (in seconds)
  ping_service_name: 'http', //if ping_service_name is not defined, 'http' is used by default
  failed_ping_interval: one_minute, //set ping interval if site is down (in seconds)
  enabled: true, //enables/disables this host
  alert_to: ['ivan@iloire.com'], //emails to alert if site goes down.
  warning_if_takes_more_than: 700, //miliseconds. alert if request takes more than this
  remove_events_older_than_seconds : 60 * 60 * 24 * 10, // remove events older than (seconds)
  services : [
    {
      name : 'home',
      method: 'get',
      auth:'username:password', //optional
      url : '/',
      //expected status code and expected string to be found in the response (otherwise will fail)
      expected: {statuscode: 200, contains: 'A blog about node.js and express.js'}
    } ,
    {
      name : 'contact page',
      method: 'get',
      auth:'username:password', //optional
      url : '/contact',
      expected: {statuscode: 200, contains: 'Contact page'}
    }
  ]
} ,

//example of smtp ping
{
  name:'mydomain',
  host: 'mydomain.com',
  port:25,
  ping_interval: one_minute, //set ping interval (in seconds)
  ping_service_name: 'smtp',
  failed_ping_interval: one_minute,
  enabled: true,
  alert_to: ['ivan@iloire.com'], //emails to alert if site goes down.
  warning_if_takes_more_than: 700, //miliseconds. alert if request takes more than this
  services : [
    {
      name : 'my smtp server'
    }
  ]
}
```

### Authorization settings (since 2.2.0)

Since version ``2.2.0`` you can restrict reporting access to services or hosts to certain users (authentication works using passportjs's OAuth2 GoogleStrategy).

Simply use the ``restrictedTo`` option for a particular service or host.


```js
{
  name:'letsnode blog',
  host: 'letsnode.com',
  port:80,
  ping_interval: one_minute, //set ping interval (in seconds)
  ping_service_name: 'http', //if ping_service_name is not defined, 'http' is used by default
  failed_ping_interval: one_minute, //set ping interval if site is down (in seconds)
  services : [
    {
      name : 'home',
      method: 'get',
      url : '/',
      expected: {statuscode: 200, contains: 'A blog about node.js and express.js'},
      restrictedTo: ["admin@yourdomain.com"] // you can apply restrictions at a service or host 
    }
  ],
level
} ,
```

Make sure you set the right hostname in the ``config/web.js`` file so the OAuth dance can be negociated correctly:

```js
public_host_name: 'http://watchmen.letsnode.com/', // required for OAuth dance
```

You will also need to set the Google client ID and secret using ``env`` variables accordingly. (Login into https://console.developers.google.com/ to create them first)

```js
auth: {
	GOOGLE_CLIENT_ID: process.env.WATCHMEN_GOOGLE_CLIENT_ID || '<Create credentials from Google Dev Console>',
	GOOGLE_CLIENT_SECRET: process.env.WATCHMEN_GOOGLE_CLIENT_SECRET || '<Create credentials from Google Dev Console>'
},
```

### Ping services

#### HTTP

Using http ping service, you can also check for a) certain http status code or b) a certain text in the response stream.

##### Main properties:

- `host.host`
- `host.port`
- `host.ping_service_name` (use 'http', although it is the default value)
- `service.method` (get/post)
- `service.url`
- `service.expected` (expected status code, expected text to be found in response)

#### SMTP
##### Main properties:

- `host.host`
- `host.port`
- `host.ping_service_name` (use 'smtp')

### b) Notifications settings:

You can use one, many or none of the following notification services simultaneously:

#### AWS-SES

```
export WATCHMEN_NOTIFICATIONS_AWS_SES_ENABLED='true'

export WATCHMEN_AWS_FROM='your@email'
export WATCHMEN_AWS_REGION='your AWS region'
export WATCHMEN_AWS_KEY='your AWS Key'
export WATCHMEN_AWS_SECRET='your AWS secret'

```

#### Postmark

```
export WATCHMEN_NOTIFICATIONS_POSTMARK_ENABLED='true'

export WATCHMEN_POSTMARK_FROM='your@email'
export WATCHMEN_POSTMARK_API_KEY='your Postmark API key'
```

Every time the service triggers an alert, a notification will be send using the predefined notification services to the email addresses defined on the ``alert_to`` property for a particular service or host.

Also, you can subscribe a list of emails to receive all the notifications form all the services by using:

```
export WATCHMEN_NOTIFICATIONS_ALWAYS_ALERT_TO="admin1@domain.com, leaddev@domain.com"
```

### c) Configure the storage provider

```js
//-------------------
// config/storage.js
//-------------------

module.exports = {

  //---------------------------
  // Select storage provider.
  // Supported providers: 'redis' (only redis at this time)
  //---------------------------
  provider : 'redis',

  options : {

    //---------------------------
    // redis configuration
    //---------------------------
    'redis' : {
      port: 1216,
      host: '127.0.0.1',
      db: 1
    }
  }
};
```
### Storage providers

#### Redis
##### Installation and configuration

1. get redis from [redis.io](http://redis.io)
2. launch the server:

```
    $ redis-server redis.conf
```
### d) Add custom logic

Example: log in the console and send email if there is an outage:

```js
//-------------------
// server.js
//-------------------

var watchmen = new WatchMenFactory(services, storage);

watchmen.on('service_error', eventHandlers.onServiceError);
watchmen.on('service_warning', eventHandlers.onServiceWarning);
watchmen.on('service_back', eventHandlers.onServiceBack);
watchmen.on('service_ok', eventHandlers.onServiceOk);

// your own additional custom handlers:
watchmen.on('service_error', function(service, state){
  // do stuff on error
});

watchmen.start();
```

## Tests

    $ npm test

### Test coverage

    $ npm run coverage

Then check the coverage reports:

    $ open coverage/lcov-report/lib/index.html

## History

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
