var gendata = require('./tools/data-generator');

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-mocha-test');
  
  grunt.initConfig({
    mochaTest: {
      test: {
        options: {
          reporter: 'dot'
        },
        src: ['test/**/*.js']
      }
    }
  });
  
  grunt.registerTask('test', function() {
    var done = this.async();

    // start server
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'fatal';
    require('./server.js');

    // run tests
    grunt.task.run('mochaTest');
    done();
  });

  grunt.registerTask('data:clear', function() {
    gendata.clearData(this.async());
  });

  grunt.registerTask('data:generate', function(num) {
    gendata.genData(num, this.async());
  });

  grunt.registerTask('data:loadConfig', function(path) {
    gendata.loadConfig(path, this.async());
  });
};