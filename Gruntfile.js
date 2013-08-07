module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-mocha-test');
  
  grunt.initConfig({
    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['test/**/*.js']
      }
    }
  });
  
  grunt.registerTask('test', function() {
    var done = this.async();
    require('./server.js');
    grunt.task.run('mochaTest');
    done();
  });
};