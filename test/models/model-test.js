var expect          = require('chai').expect;
var helper          = require('../test-helper')();
var schema          = require('../../lib/schema');
var models          = require('../../lib/models');
var configCalendar  = require('../fixtures/config-school-calendar.json');

var modelTests = [
  {
    name: 'Family',
    model: models.Family,
    schema: schema.FamilySchema,
    sampleData: function() {
      return {
        name: 'Test',
        contacts: [
          { firstName: 'Glen', lastName: 'Cooper' },
          { firstName: 'Shannon', lastName: 'Stevens' }
        ]
      };
    },
    create: function(data, done) {
      schema.FamilySchema.create(data, done);
    }
  },
  {
    name: 'Student',
    model: models.Student,
    schema: schema.StudentSchema,
    sampleData: function() {
      return {
        firstName: 'Joe',
        lastName: 'Student',
        graduatingClass: '2015'
      };
    },
    create: function(data, done) {
      schema.FamilySchema.create({name:"Test"}, function(err, doc) {
        data.family = doc._id;
        schema.StudentSchema.create(data, done);
      });
    },
    beforeCreate: function(model, done) {
      schema.FamilySchema.create({name:"Test"}, function(err, doc) {
        model.family = doc._id;
        done(model);
      });
    }
  }
];

modelTests.forEach(function(test) {
  var reset = function(done) {
    helper.db.reset([schema.FamilySchema, schema.StudentSchema, schema.ConfigSchema], done);
  };

  var init = function(done) {
    reset(function() {
      schema.ConfigSchema.create(configCalendar, done);
    });
  };

  var initWithOne = function(done) {
    init(function() {
      test.create(test.sampleData(), function(err, doc) {
        done(doc._id);
      });
    });
  };

  describe(test.name, function() {

    describe('api', function() {

      var methods = ['get', 'query', 'create', 'update', 'del'];
      methods.forEach(function(m) {
        it ('has method ' + m, function() {
          expect(test.model).to.respondTo(m);
        });
      });

    });

    describe('get', function() {
      var context = {};
      beforeEach(function(done) {
        initWithOne(function(id) {
          context.id = id;
          done();
        });
      });

      afterEach(reset);

      it ('retrieves a model by id', function(done) {
        test.model.get(context.id, function(err, model) {
          expect(err).not.to.exist;
          expect(model).to.exist;
          done();
        });
      });

      it ('raises NotFoundError with invalid id', function(done) {
        test.model.get('000000000000000000000000', function(err, model) {
          expect(err).to.exist;
          expect(err).to.be.an.instanceof(models.errors.NotFoundError);
          done();
        });
      });

    });

    describe('create', function() {

      beforeEach(init);
      afterEach(reset);

      it('saves new model to database', function(done) {
        var doCreate = function(model) {
          test.model.create(model, function(err, model) {
            expect(err).not.to.exist;
            expect(model).to.exist;
            test.schema.findById(model._id, function(err, doc) {
              expect(doc).to.exist;
              done();
            });
          });
        };

        if (test.beforeCreate) {
          test.beforeCreate(test.sampleData(), doCreate);
        } else {
          doCreate(test.sampleData());
        }
        
      });

    });

    describe('update', function() {
      var context = {};
      beforeEach(function(done) {
        initWithOne(function(id) {
          context.id = id;
          done();
        });
      });

      afterEach(reset);

      it('updates record in the database', function(done) {
        var data = test.sampleData();
        var prop = Object.keys(data)[0];
        data[prop] = 'new_value';
        test.model.update(context.id, data, function(err, model) {
          expect(err).not.to.exist;
          expect(model).to.exist;
          expect(model._id.toString()).to.equal(context.id.toString());
          expect(model[prop]).to.equal('new_value');
          done();
        });
      });

      it ('raises NotFoundError with invalid id', function(done) {
        test.model.update('000000000000000000000000', test.sampleData(), function(err, doc) {
          expect(err).to.exist;
          expect(err).to.be.an.instanceof(models.errors.NotFoundError);
          done();
        });
      });

    });

    describe('del', function() {
      var context = {};
      beforeEach(function(done) {
        initWithOne(function(id) {
          context.id = id;
          done();
        });
      });

      afterEach(reset);

      it ('deletes model from the database', function(done) {
        test.model.del(context.id, function(err) {
          expect(err).not.to.exist;
          test.schema.findById(context.id, function(err, doc) {
            expect(err).not.to.exist;
            expect(doc).not.to.exist;
            done();
          });
        });
      });

      it ('raises NotFoundError with invalid id', function(done) {
        test.model.get('000000000000000000000000', function(err, model) {
          expect(err).to.exist;
          expect(err).to.be.an.instanceof(models.errors.NotFoundError);
          done();
        });
      });

    });

  });

});
