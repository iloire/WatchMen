module.exports = {

  production: {
    provider : 'redis',
    options : {
      'redis' : {
        port: process.env.WATCHMEN_REDIS_PORT_PRODUCTION || 1216,
        host: process.env.WATCHMEN_REDIS_ADDR_PRODUCTION || '127.0.0.1',
        db: process.env.WATCHMEN_REDIS_DB_PRODUCTION || 1
      }
    }
  },

  development: {
    provider : 'redis',
    options : {
      'redis' : {
        port: process.env.WATCHMEN_REDIS_PORT_DEVELOPMENT || 6379,
        host: process.env.WATCHMEN_REDIS_ADDR_DEVELOPMENT || '127.0.0.1',
        db: process.env.WATCHMEN_REDIS_DB_DEVELOPMENT || 2
      }
    }
  },

  test: {
    provider : 'redis',
    options : {
      'redis' : {
        port: process.env.WATCHMEN_REDIS_PORT_TEST || 6379,
        host: process.env.WATCHMEN_REDIS_ADDR_TEST || '127.0.0.1',
        db: process.env.WATCHMEN_REDIS_DB_TEST || 1
      }
    }
	/*
	,retry_strategy: function (options) {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            // End reconnecting on a specific error and flush all commands with a individual error
            return new Error('The server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            // End reconnecting after a specific timeout and flush all commands with a individual error
            return new Error('Retry time exhausted');
        }
        if (options.times_connected > 10) {
            // End reconnecting with built in error
            return undefined;
        }
        // reconnect after
        return Math.min(options.attempt * 100, 3000);
    }
	*/
  }

};