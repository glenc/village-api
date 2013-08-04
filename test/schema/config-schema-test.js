var expect = require('chai').expect;
var helper = require('../test-helper')();
var schema = require('../../lib/schema');

describe('ConfigSchema', function() {
  var reset = function(done) {
    helper.db.reset([schema.ConfigSchema], done);
  };

  before(reset);
  after(reset);

  describe('validation', function() {
    beforeEach(reset);

    it('requires a key', function(done) {
      var setting = { value: 'foo' };
      schema.ConfigSchema.create(setting, function(err, doc) {
        expect(err).to.exist;
        expect(err.name).to.equal('ValidationError');
        done();
      });
    });

    it ('requires a unique key', function(done) {
      var setting = { key: 'foo' };
      schema.ConfigSchema.create(setting, function(err, doc) {
        expect(err).to.not.exist;
        schema.ConfigSchema.create(setting, function(err, doc) {
          expect(err).to.exist;
          expect(err.err).to.contain('duplicate key');
          done();
        });
      });
    });
  });
});