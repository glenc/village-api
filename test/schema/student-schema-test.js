expect        = require('chai').expect;
helper        = require('../test-helper')();
schema        = require('../../lib/schema');

describe('StudentSchema', function() {
  
  var reset = function(done) {
    helper.db.reset([schema.FamilySchema, schema.StudentSchema], done);
  };

  before(reset);
  after(reset);

  describe('validation', function() {

    var setup = {};
    before(function(done) {
      schema.FamilySchema.create({name: 'Test'}, function(err, doc) {
        setup.id = doc._id;
        done();
      });
    });

    after(reset);

    var validStudent = function() {
      return {
        firstName: "Glen",
        lastName: "Cooper",
        family: setup.id,
        graduatingClass: "2014"
      };
    };

    var testRequiredProperty = function(property) {
      it ("requires " + property, function(done) {
        data = validStudent();
        data[property] = null;
        schema.StudentSchema.create(data, function(err, doc) {
          expect(err).to.exist;
          expect(err.name).to.equal("ValidationError");
          done();
        });
      });
    };

    var requiredProps = ['firstName', 'lastName', 'family', 'graduatingClass'];
    requiredProps.forEach(function(prop) {
      testRequiredProperty(prop);
    });

  });

});