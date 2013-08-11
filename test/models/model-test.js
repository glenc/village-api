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
          { firstName: 'Glen', lastName: 'Cooper', address: { street1: '123' }, phoneNumbers: [ { type:'Home', number: '123' } ] },
          { firstName: 'Shannon', lastName: 'Stevens', address: { street1: '123' }, phoneNumbers: [ { type:'Home', number: '123' } ] }
        ]
      };
    },
    create: function(data, done) {
      schema.FamilySchema.create(data, done);
    },
    init: function(done) {
      schema.ConfigSchema.create(configCalendar, done);
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
        if (Array.isArray(data)) {
          data = data.map(function(d) {
            d.family = doc._id;
            return d;
          });
        } else {
          data.family = doc._id;
        }
        schema.StudentSchema.create(data, done);
      });
    },
    beforeCreate: function(model, done) {
      schema.FamilySchema.create({name:"Test"}, function(err, doc) {
        model.family = doc._id;
        done(model);
      });
    },
    init: function(done) {
      schema.ConfigSchema.create(configCalendar, done);
    }
  },
  {
    name: 'Config',
    model: models.Config,
    schema: schema.ConfigSchema,
    sampleData: function() {
      return {
        key: 'Test',
        value: { setting: 'value', setting2: 'value2' }
      };
    },
    create: function(data, done) {
      schema.ConfigSchema.create(data, done);
    }
  }
];

modelTests.forEach(function(test) {
  var reset = function(done) {
    helper.db.reset([schema.FamilySchema, schema.StudentSchema, schema.ConfigSchema], done);
  };

  var init = function(done) {
    var fn = test.init || function(done) { done(); };
    reset(function() { fn(done); });
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

    describe('query', function() {
      var randomVals = ['one', 'two', 'three', 'four', 'five'];
      var prop = Object.keys(test.sampleData())[0];

      beforeEach(function(done) {
        init(function() {
          var makeSample = function(val) {
            var obj = test.sampleData();
            obj[prop] = val;
            return obj;
          };
          var models = randomVals.map(makeSample);
          test.create(models, done);
        });
      });

      afterEach(reset);

      it ("returns all when no query provided", function(done) {
        test.model.query({}, null, function(err, results) {
          expect(err).not.to.exist;
          expect(results).to.have.length(randomVals.length);
          results.forEach(function(model) {
            expect(randomVals).to.include(model[prop]);
          });
          done();
        });
      });

      it ("returns matches when exact query provided", function(done) {
        var query = {};
        query[prop] = randomVals[0];
        test.model.query(query, null, function(err, results) {
          expect(err).not.to.exist;
          expect(results).to.have.length(1);
          expect(results[0][prop]).to.equal(randomVals[0]);
          done();
        });
      });

      it ("returns matches when query provided", function(done) {
        var query = {};
        query[prop] = /^f[a-z]*/;
        test.model.query(query, null, function(err, results) {
          expect(err).not.to.exist;
          expect(results).to.have.length(2);
          results.forEach(function(model) {
            expect(['four', 'five']).to.include(model[prop]);
          });
          done();
        });
      });

      it ("returns all properties when no expand string is provided", function(done) {
        var props = Object.keys(test.sampleData());
        test.model.query({}, null, function(err, results) {
          expect(err).not.to.exist;
          var resultProps = Object.keys(results[0]);
          expect(resultProps).to.have.length.of.at.least(props.length);
          props.forEach(function(p) {
            expect(resultProps).to.include(p);
          });
          done();
        });
      });

      it ("returns only prop asked for when expand string is provided", function(done) {
        test.model.query({}, prop, function(err, results) {
          expect(err).not.to.exist;
          var resultProps = Object.keys(results[0]);
          var expectedProps = ['_id', prop];
          expect(resultProps).to.have.length(expectedProps.length);
          resultProps.forEach(function(p) {
            expect(expectedProps).to.include(p);
          });
          done();
        });
      });

      it ("returns multiple props when expand string contains multiple", function(done) {
        var props = Object.keys(test.sampleData());
        if (props.length == 1) { return done(); }

        var expectedProps = [prop, props[1]];
        var propString = expectedProps.join(' ');
        test.model.query({}, propString, function(err, results) {
          expect(err).not.to.exist;
          expectedProps.push('_id');
          var resultProps = Object.keys(results[0]);
          expect(resultProps).to.have.length(expectedProps.length);
          resultProps.forEach(function(p) {
            expect(expectedProps).to.include(p);
          });
          done();
        });
      });

      it ("returns props except excluded when expand string contains exclusion", function(done) {
        test.model.query({}, "-"+prop, function(err, results) {
          expect(err).not.to.exist;
          var resultProps = Object.keys(results[0]);
          var expectedProps = Object.keys(test.sampleData()).filter(function(k) { return k != prop; });
          expect(resultProps).not.to.include(prop);
          expectedProps.forEach(function(p) {
            expect(resultProps).to.include(p);
          });
          done();
        });
      });

    });

  });

});
