const w = require('../utils/logger');
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

// Note: with mongo, target DB at end of url will be created if not already existent.
const builtUrl = 'mongodb://' + process.env.PRF_DB_HOST + ':' + process.env.PRF_DB_PORT + '/' + process.env.PRF_DB_NAME;
const url = process.env.PRF_DB_URI || builtUrl;
const collectionName = process.env.PRF_DB_COLLECTION_PROFILES;

var dbconn;
var col;

module.exports = {
  dbsetup: function (callback) {
    MongoClient.connect(url)//.connectAsync(url)
      .then(function (db) {
        w.debug('profilic::bootstrapdata %%% Got Connection');
        w.debug('... Connection established with', url);
        w.debug('... Connected to database:' + db.databaseName);
        w.debug(' ');

        //will reuse single db connection and close when app shuts down.
        dbconn = db;

        //MongoDB creates a collection implicitly when a collection is first referenced.
        w.debug('... getting profiles collection...');

        //WARINING: Don't look at the mongodb docs: using the native nodejs drivers (see require mongodb up top)
        //So use docs for nodejs drivers here: http://mongodb.github.io/node-mongodb-native/2.2/api/Collection.html
        col = db.collection(collectionName); //synchronous!!
        col.find({}).toArray() //.toArrayAsync()
          .then(function (docs) {
            let count = docs.length;
            w.info('%%% Got [' + count + '] items');
            return callback();
          })
          .catch(function (err) {
            w.debug(err);
            throw (err);
          });
      })
      .catch(function (err) {
        w.debug(err);
        return callback(err);
      });
  },

  getDBConn: function () {
    return dbconn;
  },

  closeDBConn: function () {
    if (dbconn != null) {
      dbconn.close();
    }
  }
}; //end module.exports
