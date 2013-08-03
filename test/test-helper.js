var mongoose = require('mongoose');
var config = require('./config.json');

module.exports = function(options) {
  options = options || config;

  if (mongoose.connection.readyState === 0) {
    mongoose.connect(options.dbconn, function (err) {
     if (err) {
       throw err;
     }
   });
  }

  var resetDb = function(schemas, done) {
    var removed = 0;

    var finalize = function() {
      if (removed == schemas.length) {
        return done();
      }
    };

    schemas.forEach(function(s) {
      s.remove(function() {
        removed++;
        finalize();
      });
    });
  };

  return {
    db: {
      reset: resetDb
    }
  };
};