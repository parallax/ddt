var allTestFiles = [];
var TEST_REGEXP = /test\/.+\.js$/i;

var pathToModule = function(path) {
  return path.replace(/^\/base\//, '').replace(/\.js$/, '');
};

Object.keys(window.__karma__.files).forEach(function(file) {
  if (TEST_REGEXP.test(file)) {
    // Normalize paths to RequireJS module names.
    allTestFiles.push(pathToModule(file));
  }
});

require.config({
  // Karma serves files under /base, which is the basePath from your config file
  baseUrl: '/base',

  // dynamically load all test files
  deps: allTestFiles,

  // we have to kickoff jasmine, as it is asynchronous
  callback: window.__karma__.start,

    paths : {
        'jquery'       : './bower_components/jquery/dist/jquery.min',
        'lodash'       : './bower_components/lodash/dist/lodash.min',
        'knockout'     : '//cdnjs.cloudflare.com/ajax/libs/knockout/3.1.0/knockout-min',
        'eventEmitter' : './bower_components/eventEmitter/EventEmitter.min',
        'chai'         : './node_modules/chai/chai'
    }
});
