var schema          = require('../../lib/schema');
var SchoolCalendar  = require('../../lib/school-calendar');
var errors          = require('./errors');

var Config = module.exports = function() {

  var configToObject = function(config) {
    return config.toObject();
  };

  var query = function(query, expand, callback) {
    schema.ConfigSchema.find(query, expand, function(err, results) {
      if (err) return callback(err);
      callback(null, results.map(configToObject));
    });
  };

  var get = function(id, callback) {
    schema.ConfigSchema.findById(id, function(err, doc) {
      if (err) return callback(err);
      if (!doc) return callback(new errors.NotFoundError());
      callback(null, configToObject(doc));
    });
  };

  var create = function(config, callback) {
    schema.ConfigSchema.create(config, function(err, doc) {
      if (err) return callback(err);
      callback(null, configToObject(doc));
    });
  };

  var update = function(id, config, callback) {
    delete config._id;
    schema.ConfigSchema.findByIdAndUpdate(id, config, function(err, doc) {
      if (err) return callback(err);
      if (!doc) return callback(new errors.NotFoundError());
      callback(null, configToObject(doc));
    });
  };

  var del = function(id, callback) {
    schema.ConfigSchema.findByIdAndRemove(id, function(err, doc) {
      if (err) return callback(err);
      if (!doc) return callback(new errors.NotFoundError());
      callback(null);
    });
  };

  return {
    query: query,
    get: get,
    create: create,
    update: update,
    del: del
  };
}();