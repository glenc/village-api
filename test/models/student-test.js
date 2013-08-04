var expect          = require('chai').expect;
var helper          = require('../test-helper')();
var schema          = require('../../lib/schema');
var models          = require('../../lib/models');

describe("Student (specific)", function() {

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
    before(function(done) {
      init(function() {
        schema.FamilySchema.create({name:'Test'}, function(err, doc) {
          var student = {
            firstName: 'Glen',
            lastName: 'Cooper',
            graduatingClass: 'firstGrade',
            family: doc._id
          };
          schema.StudentSchema.create(student, function(err, doc) {
            context.id = doc._id;
            done();
          });
        });
      });
    });

    after(reset);

    it("populates student's grade", function(done) {
      models.Student.get(context.id, function(err, s) {
        expect(s.grade).to.equal(1);
        done();
      });
    });
  });

  describe("query", function(done) {
    var context = {};
    before(function(done) {
      init(function() {
        schema.FamilySchema.create({name:'Test'}, function(err, doc) {
          var student = {
            firstName: 'Glen',
            lastName: 'Cooper',
            graduatingClass: 'firstGrade',
            family: doc._id
          };
          schema.StudentSchema.create(student, function(err, doc) {
            context.id = doc._id;
            done();
          });
        });
      });
    });

    after(reset);

    it("populates student's grade when no expand string provided", function(done) {
      models.Student.query({}, null, function(err, results) {
        expect(results[0]).to.have.property('grade');
        expect(results[0].grade).to.equal(1);
        done();
      });
    });

    it("populate's student's grade when expand string includes grade", function(done) {
      models.Student.query({}, "grade", function(err, results) {
        expect(results[0]).to.have.property('grade');
        expect(results[0].grade).to.equal(1);
        done();
      });
    });
  });

});