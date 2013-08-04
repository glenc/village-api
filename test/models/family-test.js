var expect          = require('chai').expect;
var helper          = require('../test-helper')();
var schema          = require('../../lib/schema');
var models          = require('../../lib/models');

describe("Family (specific)", function() {

  var reset = function(done) {
    helper.db.reset([schema.FamilySchema, schema.StudentSchema, schema.ConfigSchema], done);
  };

  var init = function(done) {
    reset(function() {
      schema.ConfigSchema.create(helper.config.generateCalendar(), done);
    });
  };

  describe("get", function(done) {
    var context = {};
    var sampleFamily = {
      name: "Test",
      contacts: [
        { type: 'Parent', firstName: 'Glen', lastName: 'Cooper', address: { street1: '123' }, phoneNumbers: [ { type: 'Home', number: '123' } ]},
        { type: 'Parent', firstName: 'Shannon', lastName: 'Stevens', address: { street1: '123' }, phoneNumbers: [ { type: 'Home', number: '123' } ]}
      ]
    };
    before(function(done) {
      init(function() {
        schema.FamilySchema.create(sampleFamily, function(err, doc) {
          context.id = doc._id;
          var student = {
            firstName: 'Glen',
            lastName: 'Cooper',
            graduatingClass: 'firstGrade',
            family: doc._id
          };
          schema.StudentSchema.create(student, function(err, doc) {
            done();
          });
        });
      });
    });

    after(reset);

    it("populates contacts", function(done) {
      models.Family.get(context.id, function(err, fam) {
        expect(fam.contacts).to.exist;
        expect(fam.contacts).to.have.length(2);
        var c = fam.contacts[0];
        expect(c).to.have.property('type');
        expect(c).to.have.property('firstName');
        expect(c).to.have.property('lastName');
        expect(c).to.have.property('address');
        expect(c).to.have.property('phoneNumbers');
        done();
      });
    });

    it("populates students", function(done) {
      models.Family.get(context.id, function(err, fam) {
        expect(fam.students).to.exist;
        expect(fam.students).to.have.length(1);
        var s = fam.students[0];
        expect(s).to.have.property('firstName');
        expect(s).to.have.property('lastName');
        expect(s).to.have.property('graduatingClass');
        expect(s).to.have.property('grade');
        expect(s).to.have.property('family');
        done();
      });
    });
  });

  describe("query", function() {
    var context = {};
    var sampleFamily = {
      name: "Test",
      contacts: [
        { type: 'Parent', firstName: 'Glen', lastName: 'Cooper', address: { street1: '123' }, phoneNumbers: [ { type: 'Home', number: '123' } ]},
        { type: 'Parent', firstName: 'Shannon', lastName: 'Stevens', address: { street1: '123' }, phoneNumbers: [ { type: 'Home', number: '123' } ]}
      ]
    };
    before(function(done) {
      init(function() {
        schema.FamilySchema.create(sampleFamily, function(err, doc) {
          context.id = doc._id;
          var student = {
            firstName: 'Glen',
            lastName: 'Cooper',
            graduatingClass: 'firstGrade',
            family: doc._id
          };
          schema.StudentSchema.create(student, function(err, doc) {
            done();
          });
        });
      });
    });

    after(reset);

    it("populates contacts when contacts is in expand string", function(done) {
      models.Family.query({}, "contacts", function(err, results) {
        var fam = results[0];
        expect(fam).to.have.property('contacts');
        expect(fam.contacts).to.have.length(sampleFamily.contacts.length);
        var actualProps = Object.keys(fam.contacts[0]);
        var expectedProps = Object.keys(sampleFamily.contacts[0]);
        expectedProps.forEach(function(p) {
          expect(actualProps).to.include(p);
        });
        done();
      });
    });

    it("populates contact fields when contact fields are in expand string", function(done) {
      models.Family.query({}, "contacts.firstName contacts.lastName", function(err, results) {
        var fam = results[0];
        expect(fam).to.have.property('contacts');
        expect(fam.contacts).to.have.length(sampleFamily.contacts.length);
        var actualProps = Object.keys(fam.contacts[0]);
        var expectedProps = ['firstName', 'lastName'];
        expect(expectedProps).to.have.length(actualProps.length);
        expectedProps.forEach(function(p) {
          expect(actualProps).to.include(p);
        });
        done();
      });
    });

    it("populates students when students is in expand string", function(done) {
      models.Family.query({}, "students", function(err, results) {
        var fam = results[0];
        expect(fam).to.have.property('students');
        expect(fam.students).to.have.length(1);
        var actualProps = Object.keys(fam.students[0]);
        var expectedProps = ['firstName', 'lastName', 'graduatingClass', 'grade', 'family'];
        expectedProps.forEach(function(p) {
          expect(actualProps).to.include(p);
        });
        done();
      });
    });

    it("populates student fields when student fields are in expand string", function(done) {
      models.Family.query({}, "students.firstName students.lastName", function(err, results) {
        var fam = results[0];
        expect(fam).to.have.property('students');
        expect(fam.students).to.have.length(1);
        var actualProps = Object.keys(fam.students[0]);
        var expectedProps = ['firstName', 'lastName', '_id', 'family']; // always contains id and family
        expect(expectedProps).to.have.length(actualProps.length);
        expectedProps.forEach(function(p) {
          expect(actualProps).to.include(p);
        });
        done();
      });
    });

    it("populates student grade field when student.grade is in expand string", function(done) {
      models.Family.query({}, "students.grade", function(err, results) {
        var fam = results[0];
        expect(fam).to.have.property('students');
        expect(fam.students).to.have.length(1);
        var actualProps = Object.keys(fam.students[0]);
        expect(actualProps).to.include('grade');
        done();
      });
    });
  });

});