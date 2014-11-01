/**
 * Module dependencies
 */

var angular = window.angular;
var cj2hyper = require('cj2hyper');

/**
 * Initialize the package
 */

var pkg = module.exports = angular.module('ng-hyper-cj', ['ng-hyper']);

pkg.factory('cj2hyperInterceptor', [
  function() {
    return {
      response: function(res) {
        var type = res.headers()['content-type'] || '';
        if (!~type.indexOf('collection+json')) return res;
        try {
          res.data = cj2hyper(res.data);
        } catch (err) {
          console.error(err);
        }
        return res;
      }
    };
}]);

pkg.config([
  '$httpProvider',
  function($httpProvider) {
    $httpProvider.interceptors.push('cj2hyperInterceptor');
  }
]);
