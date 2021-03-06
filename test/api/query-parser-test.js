var expect = require('chai').expect;
var parser = require('../../lib/api/query-parser');

describe('QueryParser', function() {

  describe('parse', function() {

    it('parses string into keys and values on an object', function() {
      var query = 'key:value';
      var obj = parser.parse(query);
      expect(obj.key).to.exist;
      expect(obj.key).to.eql('value');
    });

    it('parses multiple segments into multiple keys and values on an object', function() {
      var query = 'key:value,key2:value2';
      var obj = parser.parse(query);
      expect(obj.key).to.exist;
      expect(obj.key).to.eql('value');
      expect(obj.key2).to.exist;
      expect(obj.key2).to.eql('value2');
    });

    it('parses a wildcard into a regular expression value', function() {
      var query = 'key:*value*,key2:value*,key3:*value';
      var obj = parser.parse(query);
      expect(obj.key).to.eql(/value/i);
      expect(obj.key2).to.eql(/^value/i);
      expect(obj.key3).to.eql(/value$/i);
    });

    it('returns an empty object with empty or null string', function() {
      expect(parser.parse()).to.eql({});
      expect(parser.parse('')).to.eql({});
    });

  });

});