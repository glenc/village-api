expect        = require('chai').expect;
helper        = require('../test-helper')();
schema        = require('../../lib/schema');

describe('FamilySchema', function() {
  
  var reset = function(done) {
    helper.db.reset([schema.FamilySchema], done);
  };

  before(reset);
  after(reset);

  describe('validation', function() {

    before(reset);
    after(reset);

    it ("requires name", function(done) {
      schema.FamilySchema.create({}, function(err, doc) {
        expect(err).to.exist;
        expect(err.name).to.equal("ValidationError");
        done();
      });
    });

    it ("requires a unique name", function(done) {
      schema.FamilySchema.create({name:"Test"}, function(err, doc) {
        expect(err).not.to.exist;
        schema.FamilySchema.create({name:"Test"}, function(err, doc) {
          expect(err).to.exist;
          expect(err.err).to.contain("duplicate key");
          done();
        });
      });
    });

  });

  describe('Contact', function() {

    describe('validation', function() {
      var fam = {};
      beforeEach(function(done) {
        fam = new schema.FamilySchema({name:"Test"});
        done();
      });

      var validContact = function() {
        return {
          firstName: "Glen",
          lastName: "Cooper",
          type: "Parent",
          address: {
            street1: '123 Main St',
            city: 'Woodinville',
            state: 'WA',
            zip: '98072'
          },
          phoneNumbers: [
            { type: 'Home', number: '123-123-1231' }
          ]
        };
      };

      var testRequiredProperty = function(property) {
        it ("requires " + property, function(done) {
          data = validContact();
          data[property] = null;
          fam.contacts.push(data);
          schema.FamilySchema.create(fam, function(err, doc) {
            expect(err).to.exist;
            expect(err.name).to.equal("ValidationError");
            done();
          });
        });
      };

      var requiredProps = ['firstName', 'lastName', 'type'];
      requiredProps.forEach(function(prop) {
        testRequiredProperty(prop);
      });

      describe('type', function() {
        it ('defaults to Parent when not specified', function(done) {
          fam.contacts.push({firstName: 'Glen'});
          expect(fam.contacts[0].type).to.equal('Parent');
          done();
        });

        it ('requires a known type', function(done) {
          c = validContact();
          c.type = 'Unknown';
          fam.contacts.push(c);
          schema.FamilySchema.create(c, function(err, doc) {
            expect(err).to.exist;
            expect(err.name).to.equal("ValidationError");
            done();
          });
        });
      });

    });
    
  });

});