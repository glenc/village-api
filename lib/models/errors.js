var util = require('util');

var errors = [ 'NotFoundError', 'ConfigError' ];

function AbstractError(msg, constr) {
  Error.captureStackTrace(this, constr || this);
  this.message = msg || 'Error';
}

util.inherits(AbstractError, Error);
AbstractError.prototype.name = 'Abstract Error';

errors.forEach(function (errorName) {
  var errorFn = exports[errorName] = function (msg) {
    errorFn.super_.call(this, msg, this.constructor);
  };
  util.inherits(errorFn, AbstractError);
  errorFn.prototype.name = errorName;
});