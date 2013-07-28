var util    = require('util');
var restify = require('restify');

var NotFoundError = module.exports.NotFoundError = function(id) {
  restify.RestError.call(this, {
          statusCode: 404,
          restCode: 'NotFound',
          message: id + ' was not found',
          constructorOpt: NotFoundError
  });
  this.name = 'NotFoundError';
}
util.inherits(NotFoundError, restify.RestError);