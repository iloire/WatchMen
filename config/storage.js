module.exports = {

	//---------------------------
	// Select storage provider.
	// Supported providers: 'redis'
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