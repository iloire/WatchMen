var one_tick = 20; //seconds

//service name must be unique for a certain host.
//host name must be unique
module.exports =
  [
    {
      name: 'google smtp',
      host: 'smtp.gmail.com',
      port: 465,
      ping_service_name: 'smtp',
      timeout:10000,
      ping_interval: one_tick, //seconds
      failed_ping_interval: one_tick / 3, //seconds
      enabled: true,
      alert_to: ['your-email@domain.com'],
      warning_if_takes_more_than: 1500, //miliseconds
      remove_events_older_than_seconds : 60 * 60 * 24 * 10, // purgue events older than (seconds)
      services : [
        {
          name: 'mail server'
        }
      ]
    } ,
    {
      name:'apple HTTPS',
      host: 'www.apple.com',
      port:443,
      protocol: 'https',
      ping_service_name: 'http',
      timeout:10000,
      ping_interval: one_tick, //seconds
      failed_ping_interval: one_tick / 3, //seconds
      enabled: true,
      alert_to: ['your-email@domain.com'],
      warning_if_takes_more_than: 1500, //miliseconds
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 200, contains: 'Apple Inc'}
        }
      ]
    } ,
    {
      name:'vitaminas dev',
      host: 'www.vitaminasdev.com',
      port:80,
      ping_service_name: 'http',
      timeout:10000,
      ping_interval: one_tick, //seconds
      failed_ping_interval: one_tick / 3, //seconds
      enabled: true,
      alert_to: ['your-email@domain.com'],
      warning_if_takes_more_than: 1500, //miliseconds
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 200, contains: 'noticias'}
        },
        {
          name: 'contact page',
          method: 'get',
          url : '/Home/Contacto',
          expected: {statuscode: 200, contains: 'encantados'},
          ping_interval:200, //overwrite ping and retry intervals for this url
          failed_ping_interval: one_tick / 3
        }
      ]
    } ,
    {
      name:'ASP Photo Gallery',
      host: 'www.aspphotogallery.net',
      port:80,
      ping_service_name: 'http',
      timeout:5000,
      ping_interval: one_tick,
      failed_ping_interval: one_tick / 3,
      warning_if_takes_more_than: 1300, //miliseconds
      enabled: true,
      alert_to: ['ajax@aspphotogallery.net'], //you can include a different email recipient per host
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: { statuscode: 200 , contains: 'dGallery'}
        }
      ]
    } ,
    {
      name:'cachiruloValley',
      host: 'cachirulovalley.com',
      port:80,
      ping_service_name: 'http',
      timeout:10000,
      ping_interval: one_tick,
      failed_ping_interval: one_tick / 3,
      warning_if_takes_more_than: 3000, //miliseconds
      enabled: true,
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 200, contains: ''}
        }
      ]
    } ,
    {
      name:'directorio cachirulo valley',
      host: 'directorio.cachirulovalley.com',
      port:80,
      ping_service_name: 'http',
      timeout:10000,
      ping_interval: 3 * one_tick,
      failed_ping_interval: one_tick / 3,
      warning_if_takes_more_than: 3000, //miliseconds
      enabled: true,
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 200, contains: ''}
        } ,
        {
          name: 'directory',
          method: 'get',
          url : '/directory',
          expected: {statuscode: 200, contains: ''}
        }
      ]
    } ,
    {
      name:'letsnode.com',
      host: 'letsnode.com',
      port:80,
      ping_service_name: 'http',
      timeout:10000,
      ping_interval: one_tick,
      failed_ping_interval: one_tick / 3,
      enabled: true,
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 200, contains: 'A blog about node.js and express.js'}
        }
      ]
    } ,
    {
      name:'letsnode.com frelancer service',
      host: 'letsnode.com',
      port:8080,
      ping_service_name: 'http',
      timeout:10000,
      ping_interval: one_tick,
      failed_ping_interval: one_tick / 3,
      enabled: false,
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 200, contains: 'journey'}
        }
      ]
    } ,
    {
      name:'mathrace demo',
      host: 'letsnode.com',
      port:8090,
      ping_service_name: 'http',
      timeout:10000,
      ping_interval: one_tick,
      failed_ping_interval: one_tick / 3,
      enabled: true,
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 200, contains: 'Race'}
        }
      ]
    } ,
    {
      name:'google.com',
      host: 'www.google.com',
      port:80,
      ping_service_name: 'http',
      timeout:10000,
      ping_interval: one_tick,
      failed_ping_interval: one_tick / 3,
      enabled: false,
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 302, contains: ''}
        }
      ]
    } ,
    {
      name:'localhost test',
      host: '127.0.0.1',
      port:8080,
      ping_service_name: 'http',
      ping_interval: one_tick,
      failed_ping_interval: one_tick / 3,
      alert_to: ['your-email@domain.com'],
      enabled: false,
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 200, contains: ''}
        }
      ]
    } ,
    {
      name:'amazon',
      host: 'www.amazon.com',
      port:80,
      ping_service_name: 'http',
      timeout: 10000,
      ping_interval: one_tick,
      failed_ping_interval: one_tick / 3,
      warning_if_takes_more_than: 2000, //miliseconds
      enabled: true,
      alert_to:['your-email@domain.com'],
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 200, contains: 'Amazon'}
        }
      ]
    } ,
    {
      name:'hacker news',
      host: 'news.ycombinator.com',
      port:80,
      ping_service_name: 'http',
      timeout:10000,
      ping_interval: one_tick,
      failed_ping_interval: one_tick / 3,
      warning_if_takes_more_than: 4000, //miliseconds
      enabled: true,
      alert_to:['your-email@domain.com'],
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: { statuscode: 301 }
        }
      ]
    } ,
    {
      name:'cuéntica',
      host: 'www.cuentica.com',
      port:80,
      ping_service_name: 'http',
      timeout:10000,
      ping_interval: one_tick,
      failed_ping_interval: one_tick / 3,
      enabled: true,
      warning_if_takes_more_than: 1500, //miliseconds
      alert_to:['your-email@domain.com'],
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 200, contains: 'Cuéntica'}
        }
      ]
    } ,
    {
      name:'form post test',
      host: 'hroch486.icpf.cas.cz',
      port:80,
      ping_service_name: 'http',
      ping_interval: one_tick,
      failed_ping_interval: one_tick / 3,
      enabled: true,
      services : [
        {
          name: 'post',
          method: 'get',
          url : '/formpost.html',
          expected: {statuscode: 200, contains: 'Test Form -- POST method'}
        },
        {
          name: 'post with data',
          method: 'post',
          input_data : 'your_name=Ivan&fruit=Banana',
          content_type : 'application/x-www-form-urlencoded', // application/json
          url : '/cgi-bin/echo.pl',
          expected: {statuscode: 200, contains: 'your_name = Ivan'}
        }
      ]
    } ,
    {
      name:'Menéame',
      host: 'www.meneame.net',
      port:80,
      ping_service_name: 'http',
      timeout:10000,
      ping_interval: one_tick,
      failed_ping_interval: one_tick / 3,
      warning_if_takes_more_than: 2000,
      enabled: true,
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 200, contains: 'Menéame'}
        }
      ]
    } ,
    {
      name:'node js',
      host: 'nodejs.org',
      port:80,
      ping_service_name: 'http',
      timeout:10000,
      ping_interval: one_tick,
      failed_ping_interval: one_tick / 3,
      warning_if_takes_more_than: 1500,
      enabled: true,
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 200, contains: 'Node'}
        }
      ]
    } ,
    {
      name:'redis',
      host: 'redis.io',
      port:80,
      ping_service_name: 'http',
      timeout:10000,
      ping_interval: one_tick,
      failed_ping_interval: one_tick / 3,
      warning_if_takes_more_than: 1500,
      enabled: true,
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 200, contains: 'Redis'}
        }
      ]
    } ,
    {
      name:'express',
      host: 'expressjs.com',
      port:80,
      ping_service_name: 'http',
      timeout:10000,
      ping_interval: one_tick,
      failed_ping_interval: one_tick / 3,
      enabled: true,
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 200, contains: 'web application framework'}
        }
      ]
    }
  ];