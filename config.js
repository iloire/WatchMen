/*
	ping_interval (host or url level): 
	- ping interval, in seconds.
	
	failed_ping_interval (host or url level): 
	- when site is down, ping interval, in seconds, until site is backup again

*/
var one_minute = 60 //you can set this to other value for testing the service in dev env.
var performance_test = false //set to true if you want a bulk config file to be used for testing instead of the following list of hosts

exports.database = { port: 1216, host : '127.0.0.1', db: 'watchmen' }
	
var hosts = 
	[
		{
                        name:'Apple HTTPS',
                        host: 'www.apple.com',
                        port:443,
			protocol: 'https',
                        timeout:10000,
                        ping_interval: one_minute, //seconds
                        failed_ping_interval: one_minute, //minutes
                        enabled: true,
                        alert_to: ['ivan@iloire.com'],
                        warning_if_takes_more_than: 1500, //miliseconds
                        urls : [
                                {
                                        method: 'get',
                                        url : '/',
                                        expected: {statuscode: 200, contains: 'Apple Inc'} ,
                                }
                        ]
                }
                ,
		{
			name:'VitaminasDev', 
			host: 'www.vitaminasdev.com', 
			port:80,
			timeout:10000,
			ping_interval: one_minute, //seconds
			failed_ping_interval: one_minute, //minutes
			enabled: true,
			alert_to: ['ivan@iloire.com'], 
			warning_if_takes_more_than: 1500, //miliseconds
			urls : [
				{
					method: 'get', 
					url : '/', 
					expected: {statuscode: 200, contains: 'noticias'} ,
				},
				{
					method: 'get', 
					url : '/Home/Contacto', 
					expected: {statuscode: 200, contains: 'encantados'},
					ping_interval:200, //overwrite ping and retry intervals for this url
					failed_ping_interval: one_minute/2
				}
			]
		}
		,	
		{
			name:'iloire.com', 
			host: 'www.iloire.com', 
			port:80, 
			timeout:5000,
			ping_interval: one_minute,
			failed_ping_interval: one_minute,
			warning_if_takes_more_than: 1200, //miliseconds
			enabled: true,
			urls : [
				{
					method: 'get', 
					url : '/', 
					expected: {statuscode: 200, contains: 'vitaminas'} 
				},
				{
					method: 'get', 
					url : '/en', 
					expected: {statuscode: 200, contains: 'Freelance'} 
				},
			]
		}
		,
		{
			name:'ASP Photo Gallery', 
			host: 'www.aspphotogallery.net', 
			port:80, 
			timeout:5000,
			ping_interval: one_minute,
			failed_ping_interval: one_minute,
			warning_if_takes_more_than: 1300, //miliseconds
			enabled: true,
			alert_to: ['ajax@aspphotogallery.net'], //you can include a different email recipient per host
			urls : [
				{
					method: 'get', 
					url : '/', 
					expected: {statuscode: 200, contains: 'fast and responsive'}
				},
				{
					method: 'get', 
					url : '/mvcphotogallery',
					warning_if_takes_more_than: 500,
					expected: {statuscode: 200, contains: 'Knockout'}
				},
				{
					method: 'get',
					enabled: true,
					url : '/demomvc', 
					expected: {statuscode: 200, contains: 'Simple, sexy, FAST, ASP.NET MVC photo gallery'}
				}
			]
		}
		,
		{
			name:'CachiruloValley', 
			host: 'cachirulovalley.com', 
			port:80, 
			timeout:10000,
			ping_interval: one_minute,
			failed_ping_interval: one_minute,
			warning_if_takes_more_than: 3000, //miliseconds
			enabled: true,
			urls : [
				{
					method: 'get', 
					url : '/', 
					expected: {statuscode: 200, contains: ''}
				}
			]
		}
		,
		{
			name:'SocialMadrid', 
			host: 'socialmadrid11.com', 
			port:80, 
			ping_interval: one_minute,
			warning_if_takes_more_than: 600, //miliseconds
			failed_ping_interval: one_minute,
			enabled: false,
			urls : [
				{
					method: 'get', 
					url : '/', 
					expected: {statuscode: 302, contains: ''}
				}
			]
		}
		,
		{
			name:'letsnode.com', 
			host: 'letsnode.com', 
			port:80, 
			timeout:10000,
			ping_interval: one_minute,
			failed_ping_interval: one_minute,
			enabled: true,
			urls : [
				{
					method: 'get', 
					url : '/', 
					expected: {statuscode: 200, contains: 'A blog about node.js and express.js'}
				}
			]
		}
		,
		{
			name:'letsnode.com frelancer service', 
			host: 'letsnode.com', 
			port:8080,
			timeout:10000,
			ping_interval: one_minute,
			failed_ping_interval: one_minute,
			enabled: false,
			urls : [
				{
					method: 'get', 
					url : '/', 
					expected: {statuscode: 200, contains: 'journey'}
				}
			]
		}
		,
		{
			name:'letsnode.com directory web', 
			host: 'letsnode.com',
			port:8081,
			timeout:10000,
			ping_interval: one_minute,
			failed_ping_interval: one_minute,
			enabled: false,
			urls : [
				{
					method: 'get', 
					url : '/', 
					expected: {statuscode: 200, contains: 'directory'}
				}
			]
		}
		,
		{
			name:'google.com',
			host: 'www.google.com',
			port:80,
			timeout:10000,
			ping_interval: one_minute,
			failed_ping_interval: one_minute,
			enabled: false,
			urls : [
				{
					method: 'get', 
					url : '/', 
					expected: {statuscode: 302, contains: ''}
				}
			]
		}
		,
		{
			name:'localhost test', 
			host: '127.0.0.1', 
			port:8080, 
			ping_interval: one_minute,
			failed_ping_interval: one_minute,
			alert_to: ['ivan@iloire.com'],
			enabled: false,
			urls : [
				{
					method: 'get', 
					url : '/', 
					expected: {statuscode: 200, contains: ''}
				}
			]
		}
		,
		{
			name:'Idibay direct', 
			host: 'direct.idibay.com',
			port:80,
			timeout:10000,
			ping_interval: one_minute,
			failed_ping_interval: one_minute,
			warning_if_takes_more_than: 4000, //miliseconds
			enabled: false,
			alert_to:['ivan@iloire.com'],
			urls : [
				{
					method: 'get',
					url : '/', 
					expected: {statuscode: 200, contains: 'Mundo Idibay'}
				}
			]
		}
		,
		{
			name:'Idibay', 
			host: 'www.idibay.com', 
			port:80,
			timeout:10000,
			ping_interval: one_minute,
			failed_ping_interval: one_minute,
			warning_if_takes_more_than: 4000, //miliseconds
			enabled: false,
			alert_to:['ivan@iloire.com'],
			urls : [
				{
					method: 'get',
					url : '/', 
					expected: {statuscode: 200, contains: 'Mundo Idibay'}
				}
			]
		}
		,
		{
			name:'Cuéntica', 
			host: 'www.cuentica.com', 
			port:80,
			timeout:10000,
			ping_interval: one_minute,
			failed_ping_interval: one_minute,
			enabled: false,
			warning_if_takes_more_than: 1500, //miliseconds
			alert_to:['ivan@iloire.com'],
			urls : [
				{
					method: 'get',
					url : '/', 
					expected: {statuscode: 200, contains: 'Cuéntica'}
				}
			]
		}
		,
		{
			name:'form post test', 
			host: 'hroch486.icpf.cas.cz', 
			port:80, 
			ping_interval: one_minute,
			failed_ping_interval: one_minute,
			enabled: false,
			urls : [
				{
					method: 'get',
					url : '/formpost.html', 
					expected: {statuscode: 200, contains: 'Test Form -- POST method'}
				},
				{
					method: 'post',
					input_data : 'your_name=Ivan&fruit=Banana', 
					content_type : 'application/x-www-form-urlencoded', // application/json
					url : '/cgi-bin/echo.pl', 
					expected: {statuscode: 200, contains: 'your_name = Ivan'}
				}
			]
		}
		,
		{
			name:'Menéame', 
			host: 'www.meneame.net', 
			port:80,
			timeout:10000,
			ping_interval: one_minute,
			failed_ping_interval: one_minute,
			warning_if_takes_more_than: 1500,
			enabled: false,
			urls : [
				{
					method: 'get',
					url : '/', 
					expected: {statuscode: 200, contains: 'Menéame'}
				}
			]
		}
		,
		{
			name:'node js', 
			host: 'nodejs.org', 
			port:80,
			timeout:10000,
			ping_interval: one_minute,
			failed_ping_interval: one_minute,
			warning_if_takes_more_than: 1500,
			enabled: false,
			urls : [
				{
					method: 'get',
					url : '/', 
					expected: {statuscode: 200, contains: 'Node'}
				}
			]
		}
		,
		{
			name:'redis', 
			host: 'redis.io', 
			port:80,
			timeout:10000,
			ping_interval: one_minute,
			failed_ping_interval: one_minute,
			warning_if_takes_more_than: 1500,
			enabled: false,
			urls : [
				{
					method: 'get',
					url : '/', 
					expected: {statuscode: 200, contains: 'Redis'}
				}
			]
		}
		,
		{
			name:'express', 
			host: 'expressjs.com', 
			port:80, 
			timeout:10000,
			ping_interval: one_minute,
			failed_ping_interval: one_minute,
			enabled: false,
			urls : [
				{
					method: 'get',
					url : '/', 
					expected: {statuscode: 200, contains: 'High performance'}
				}
			]
		}
	]
	
exports.hosts = function(config_hosts){
	if (performance_test)
	{
		var words = [
			'google', 'yahoo', 'node', 'business', 'internet', 'hi', 'domain', 
			'test', 'sale', 'bed', 'monitor', 'computer', 'java', 'usa',
			'pc', 'linux', 'windows', 'microsoft', 'mouse', 'animal', 'zoo',
			'mobile', 'platform', 'lake', 'spain', 'zaragoza', 'table', 'rusia',
			'brazil', 'olimpiadas', 'money', 'winter', 'films', 'movies', 'spanish', 'bar',
			'runner','magazine','audio', 'video', 'cup', 'charger', 'mykeys', 'twitter',
			'php', 'python', 'camera', 'house', 'bad', 'nscoder', 'mvc', 'screen',
			'24h', 'harbor', 'mail', 'important', 'hungry', 'pizza',
			'fiesta', 'tuberia', 'boat'
		]

		function createHost (domain){
			return {
				name : domain, 
				host: domain, 
				port: '80',
				enabled :true,
				urls : [ { url: '/', method : 'get' }],
				ping_interval : one_minute,
				failed_ping_interval : one_minute / 2,
				warning_if_takes_more_than :500
			}
		}

		var hosts = [];

		for (var i=0; i<words.length;i++){
			hosts.push (createHost (words[i] + '.com'));
			hosts.push (createHost (words[i] + '.net'));
			hosts.push (createHost (words[i] + '.org'));

			hosts.push (createHost (words[i] + '.com'));
			hosts.push (createHost (words[i] + '.net'));
			hosts.push (createHost (words[i] + '.org'));
		}
		return hosts;
	}
	else{
		return config_hosts;
	}
}(hosts);

exports.notifications = {
	Enabled: false, //if disabled, no email will be sent (just console messages)
	To: ['ivan@iloire.com'], //default notification list if no alert_to is specified for host or url
	postmark : {
		From: 'ivan@iloire.com',
		Api_key : 'your-postmark-key-here'
	}
} 
