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
      port: 6379,
      host: 'redis',
      db: 1
    }
  }
};
