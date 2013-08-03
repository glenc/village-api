expect        = require('chai').expect;
helper        = require('../test-helper')();
ConfigSchema  = require('../../lib/schema').ConfigSchema;

describe('ConfigSchema', function() {
  var reset = function(done) {
    helper.db.reset([ConfigSchema], done);
  };

  before(reset);
  after(reset);

  describe('validation', function() {
    beforeEach(reset);

    it('requires a key', function(done) {
      var setting = { value: 'foo' };
      ConfigSchema.create(setting, function(err, doc) {
        expect(err).to.exist;
        expect(err.name).to.equal('ValidationError');
        done();
      });
    });

    it ('requires a unique key', function(done) {
      var setting = { key: 'foo' };
      ConfigSchema.create(setting, function(err, doc) {
        expect(err).to.not.exist;
        ConfigSchema.create(setting, function(err, doc) {
          expect(err).to.exist;
          expect(err.err).to.contain('duplicate key');
          done();
        });
      });
    });
  });
});