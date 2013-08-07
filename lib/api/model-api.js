var models = require('../../lib/models');
var errors = require('./errors');

var handleError = function(err, req, next) {
  req.log.warn(err);
  if (err instanceof models.errors.NotFoundError) {
    return next(new errors.NotFoundError(req.params.id));
  } else {
    return next(err);
  }
};

var createApi = module.exports.createApi = function(model, options) {
  var query = function(req, res, next) {
    var expandString = '';
    if (req.params.expand) {
      expandString = req.params.expand.split(',').join(' ');
    }
    model.query({}, expandString, function(err, results) {
      if (err) return handleError(err, req, next);
      res.send(200, results);
      next();
    });
  };

  var get = function(req, res, next) {
    model.get(req.params.id, function(err, student) {
      if (err) return handleError(err, req, next);
      res.send(200, student);
      next();
    });
  };

  var create = function(req, res, next) {
    model.create(req.body, function(err, student) {
      if (err) return handleError(err, req, next);
      res.send(201, student);
      next();
    });
  };

  var update = function(req, res, next) {
    model.update(req.params.id, req.body, function(err, student) {
      if (err) return handleError(err, req, next);
      res.send(200, student);
      next();
    });
  };

  var del = function(req, res, next) {
    model.del(req.params.id, function(err) {
      if (err) return handleError(err, req, next);
      res.send(200, {message:"Item successfully deleted."});
      next();
    });
  };

  return {
    query: query,
    get: get,
    create: create,
    update: update,
    del: del
  };
};