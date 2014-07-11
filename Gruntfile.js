module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    typescript: {
      base: {
        src: 'ddt.ts',
        dest: 'ddt.js',

        options: {
          module: 'amd',
          target: 'es5',
          sourceMap: false,
          comments: true,
          noImplicitAny: true
        }
      }
    },

    watch: {
      files: ['<%= typescript.src %>'],
      tasks: ['build']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-typescript');

  grunt.registerTask('build', ['typescript:base']);
  grunt.registerTask('default', ['build']);

};