var expect          = require('chai').expect;
var restify         = require('restify');
var helper          = require('../test-helper')();
var schema          = require('../../lib/schema');
var configCalendar  = require('../fixtures/config-school-calendar.json');

var modelTests = [
  {
    url: '/families',
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
    }
  },
  {
    url: '/students',
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
    }
  }
];

var client = restify.createJsonClient({
  url: 'http://localhost:8080',
  version: '*'
});

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

  describe(test.url, function() {
    describe('GET', function() {
      var randomVals = ['one', 'two', 'three', 'four', 'five'];
      var prop = Object.keys(test.sampleData())[0];
      var context = {};

      before(function(done) {
        init(function() {
          var makeSample = function(val) {
            var obj = test.sampleData();
            obj[prop] = val;
            return obj;
          };
          var models = randomVals.map(makeSample);
          test.create(models, function() {
            client.get(test.url, function(err, req, res, data) {
              context.data = data;
              context.res = res;
              context.err = err;
              done();
            });
          });
        });
      });

      after(reset);

      it('returns 200', function() {
        expect(context.res.statusCode).to.equal(200);
      });

      it('returns data', function() {
        expect(context.data).to.exist;
      });

      it('does not return an error', function() {
        expect(context.err).not.to.exist;
      });

      it('returns all results as an array', function() {
        expect(context.data).to.have.length(randomVals.length);
        context.data.forEach(function(obj) {
          expect(randomVals).to.include(obj[prop]);
        });
      });

      it('returns all properties', function() {
        var props = Object.keys(test.sampleData());
        var resultProps = Object.keys(context.data[0]);
        expect(resultProps).to.have.length.of.at.least(props.length);
        props.forEach(function(p) {
          expect(resultProps).to.include(p);
        });
      });
    });

    describe('GET?expand', function() {
      var randomVals = ['one', 'two', 'three', 'four', 'five'];
      var prop = Object.keys(test.sampleData())[0];
      
      before(function(done) {
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

      after(reset);

      it('returns only prop asked for', function(done) {
        var url = test.url + '?expand=' + prop;
        client.get(url, function(err, req, res, data) {
          done();
        });
      });

      it('returns multiple props when multiple are provided', function(done) {
        var props = Object.keys(test.sampleData());
        if (props.length == 1) { return done(); }

        var expectedProps = [prop, props[1]];
        var propString = expectedProps.join(',');

        var url = test.url + '?expand=' + propString;
        client.get(url, function(err, req, res, data) {
          expectedProps.push('_id');
          var resultProps = Object.keys(data[0]);
          resultProps.forEach(function(p) {
            expect(expectedProps).to.include(p);
          });
          done();
        });
      });

      it ('returns props except excluded when expand string contains exclusion', function(done) {
        var url = test.url + '?expand=-' + prop;
        client.get(url, function(err, req, res, data) {
          var resultProps = Object.keys(data[0]);
          var expectedProps = Object.keys(test.sampleData()).filter(function(k) { return k != prop; });
          expect(resultProps).not.to.include(prop);
          expectedProps.forEach(function(p) {
            expect(resultProps).to.include(p);
          });
          done();
        });
      });
    });

    describe('GET?query', function() {
      var randomVals = ['one', 'two', 'three', 'four', 'five'];
      var prop = Object.keys(test.sampleData())[0];
      
      before(function(done) {
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

      after(reset);
      
      it ("returns matches when exact query provided", function(done) {
        var url = test.url + '?query=' + prop + ':' + randomVals[0];
        client.get(url, function(err, req, res, data) {
          expect(data).to.have.length(1);
          expect(data[0][prop]).to.equal(randomVals[0]);
          done();
        });
      });

      it ("returns matches when query provided", function(done) {
        var url = test.url + '?query=' + prop + ':' + '^f[a-z]*';
        client.get(url, function(err, req, res, data) {
          expect(data).to.have.length(2);
          data.forEach(function(model) {
            expect(['four', 'five']).to.include(model[prop]);
          });
          done();
        });
      });

    });

    describe('POST', function() {
      var context = {};
      before(function(done) {
        init(function() {
          var doCreate = function(model) {
            client.post(test.url, model, function(err, req, res, data) {
              context.err = err;
              context.res = res;
              context.data = data;
              done();
            });
          };

          if (test.beforeCreate) {
            test.beforeCreate(test.sampleData(), doCreate);
          } else {
            doCreate(test.sampleData());
          }
        });
      });

      after(reset);

      it('returns status code 201', function(done) {
        expect(context.res.statusCode).to.equal(201);
        done();
      });

      it('returns new object as response', function(done) {
        expect(context.data).to.exist;
        expect(context.data._id).to.exist;
        var expectedObj = test.sampleData();
        var prop = Object.keys(expectedObj)[0];
        expect(context.data[prop]).to.equal(expectedObj[prop]);
        done();
      });

      it('saves new model to database', function(done) {
        test.schema.findById(context.data._id, function(err, doc) {
          expect(doc).to.exist;
          done();
        });
      });
    });
  });

  describe(test.url + '/:id', function() {
    describe('GET', function() {

      describe('with valid id', function() {

        var context = {};
        before(function(done) {
          initWithOne(function(id) {
            client.get(test.url + '/' + id, function(err, req, res, data) {
              context.err = err;
              context.res = res;
              context.data = data;
              done();
            });
          });
        });

        after(reset);

        it('returns status code 200', function() {
          expect(context.res.statusCode).to.equal(200);
        });

        it('retrieves a model in body', function() {
          expect(context.data).to.exist;
        });

      });

      describe('with invalid id', function() {
        var context = {};
        before(function(done) {
          init(function() {
            var url = test.url + '/' + '000000000000000000000000';
            client.get(url, function(err, req, res, data) {
              context.err = err;
              context.res = res;
              context.data = data;
              done();
            });
          });
        });

        after(reset);

        it('returns status code 404', function() {
          expect(context.res.statusCode).to.equal(404);
        });

        it('returns an error object', function() {
          expect(context.err).to.exist;
          expect(context.err.restCode).to.equal('NotFound');
        });

      });

    });

    describe('PUT', function() {
      describe('with valid id', function() {

        var context = {};
        var prop = Object.keys(test.sampleData())[0];

        before(function(done) {
          initWithOne(function(id) {
            var data = test.sampleData();
            data[prop] = 'new_value';
            client.put(test.url + '/' + id, data, function(err, req, res, data) {
              context.err = err;
              context.res = res;
              context.data = data;
              done();
            });
          });
        });

        after(reset);

        it('returns status code 200', function(done) {
          expect(context.res.statusCode).to.equal(200);
          done();
        });

        it('retrieves updated model in body', function(done) {
          expect(context.data).to.exist;
          expect(context.data[prop]).to.equal('new_value');
          done();
        });

        it('updates record in the database', function(done) {
          test.schema.findById(context.data._id, function(err, doc) {
            expect(doc[prop]).to.equal('new_value');
            done();
          });
        });

      });

      describe('with invalid id', function() {
        var context = {};
        before(function(done) {
          init(function() {
            var url = test.url + '/' + '000000000000000000000000';
            client.put(url, test.sampleData(), function(err, req, res, data) {
              context.err = err;
              context.res = res;
              context.data = data;
              done();
            });
          });
        });

        after(reset);

        it('returns status code 404', function() {
          expect(context.res.statusCode).to.equal(404);
        });

        it('returns an error object', function() {
          expect(context.err).to.exist;
          expect(context.err.restCode).to.equal('NotFound');
        });

      });
    });

    describe('DELETE', function() {
      describe('with valid id', function() {

        var context = {};
        before(function(done) {
          initWithOne(function(id) {
            context.id = id;
            client.del(test.url + '/' + id, function(err, req, res, data) {
              context.err = err;
              context.res = res;
              context.data = data;
              done();
            });
          });
        });

        after(reset);

        it('returns status code 200', function(done) {
          expect(context.res.statusCode).to.equal(200);
          done();
        });

        it('removes record in the database', function(done) {
          test.schema.findById(context.id, function(err, doc) {
            expect(doc).not.to.exist;
            done();
          });
        });

      });

      describe('with invalid id', function() {
        var context = {};
        before(function(done) {
          init(function() {
            var url = test.url + '/' + '000000000000000000000000';
            client.del(url, function(err, req, res, data) {
              context.err = err;
              context.res = res;
              context.data = data;
              done();
            });
          });
        });

        after(reset);

        it('returns status code 404', function() {
          expect(context.res.statusCode).to.equal(404);
        });

        it('returns an error object', function() {
          expect(context.err).to.exist;
          expect(context.err.restCode).to.equal('NotFound');
        });

      });
    });
  });
});