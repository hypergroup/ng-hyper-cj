
;(function(){

/**
 * Require the module at `name`.
 *
 * @param {String} name
 * @return {Object} exports
 * @api public
 */

function require(name) {
  var module = require.modules[name];
  if (!module) throw new Error('failed to require "' + name + '"');

  if (!('exports' in module) && typeof module.definition === 'function') {
    module.client = module.component = true;
    module.definition.call(this, module.exports = {}, module);
    delete module.definition;
  }

  return module.exports;
}

/**
 * Meta info, accessible in the global scope unless you use AMD option.
 */

require.loader = 'component';

/**
 * Internal helper object, contains a sorting function for semantiv versioning
 */
require.helper = {};
require.helper.semVerSort = function(a, b) {
  var aArray = a.version.split('.');
  var bArray = b.version.split('.');
  for (var i=0; i<aArray.length; ++i) {
    var aInt = parseInt(aArray[i], 10);
    var bInt = parseInt(bArray[i], 10);
    if (aInt === bInt) {
      var aLex = aArray[i].substr((""+aInt).length);
      var bLex = bArray[i].substr((""+bInt).length);
      if (aLex === '' && bLex !== '') return 1;
      if (aLex !== '' && bLex === '') return -1;
      if (aLex !== '' && bLex !== '') return aLex > bLex ? 1 : -1;
      continue;
    } else if (aInt > bInt) {
      return 1;
    } else {
      return -1;
    }
  }
  return 0;
}

/**
 * Find and require a module which name starts with the provided name.
 * If multiple modules exists, the highest semver is used. 
 * This function can only be used for remote dependencies.

 * @param {String} name - module name: `user~repo`
 * @param {Boolean} returnPath - returns the canonical require path if true, 
 *                               otherwise it returns the epxorted module
 */
require.latest = function (name, returnPath) {
  function showError(name) {
    throw new Error('failed to find latest module of "' + name + '"');
  }
  // only remotes with semvers, ignore local files conataining a '/'
  var versionRegexp = /(.*)~(.*)@v?(\d+\.\d+\.\d+[^\/]*)$/;
  var remoteRegexp = /(.*)~(.*)/;
  if (!remoteRegexp.test(name)) showError(name);
  var moduleNames = Object.keys(require.modules);
  var semVerCandidates = [];
  var otherCandidates = []; // for instance: name of the git branch
  for (var i=0; i<moduleNames.length; i++) {
    var moduleName = moduleNames[i];
    if (new RegExp(name + '@').test(moduleName)) {
        var version = moduleName.substr(name.length+1);
        var semVerMatch = versionRegexp.exec(moduleName);
        if (semVerMatch != null) {
          semVerCandidates.push({version: version, name: moduleName});
        } else {
          otherCandidates.push({version: version, name: moduleName});
        } 
    }
  }
  if (semVerCandidates.concat(otherCandidates).length === 0) {
    showError(name);
  }
  if (semVerCandidates.length > 0) {
    var module = semVerCandidates.sort(require.helper.semVerSort).pop().name;
    if (returnPath === true) {
      return module;
    }
    return require(module);
  }
  // if the build contains more than one branch of the same module
  // you should not use this funciton
  var module = otherCandidates.pop().name;
  if (returnPath === true) {
    return module;
  }
  return require(module);
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Register module at `name` with callback `definition`.
 *
 * @param {String} name
 * @param {Function} definition
 * @api private
 */

require.register = function (name, definition) {
  require.modules[name] = {
    definition: definition
  };
};

/**
 * Define a module's exports immediately with `exports`.
 *
 * @param {String} name
 * @param {Generic} exports
 * @api private
 */

require.define = function (name, exports) {
  require.modules[name] = {
    exports: exports
  };
};
require.register("hypergroup~cj2hyper@0.1.1", function (exports, module) {
/**
 * Transform a Collection+JSON resource into a hyper+json representation
 *
 * @param {Object} resource
 * @return {Object}
 */

module.exports = function(resource) {
  var root = get('collection', resource);
  if (!root) throw new Error('Missing root "collection" property');

  var hyperObj = {};
  mergeItem(hyperObj, root, null, true);

  var template = get('data', get('template', root));
  if (template) hyperObj.create = {
    enctype: 'application/collection+json',
    action: hyperObj.href,
    method: 'POST',
    input: transformInputs(template)
  };

  hyperObj.collection = get('items', root, []).map(function(item) {
    return mergeItem({}, item, template);
  });

  get('queries', root, []).forEach(function(query) {
    var rel = get('rel', query);
    if (!rel) return;

    var form = hyperObj[rel] = {
      method: 'GET',
      input: {}
    };
    Object.keys(query).forEach(function(key) {
      if (key === 'rel') return;
      if (key === 'href') return form.action = query[key];
      if (key === 'data') return form.input = transformInputs(query[key]);
      form[key] = query[key];
    });
  });

  return hyperObj;
};

/**
 * Merge an item's properties into a document
 *
 * @param {Object} doc
 * @param {Object} item
 * @param {Array} template
 * @param {Boolean} isRoot
 * @return {Object}
 */

function mergeItem(doc, item, template, isRoot) {
  var href = doc.href = get('href', item);

  get('links', item, []).forEach(function(link) {
    var rel = get('rel', link);
    if (!rel) return;

    var render = get('render', link);
    var out = doc[rel] = {};
    Object.keys(link).forEach(function(key) {
      if (key === 'rel' || key === 'render') return;
      if (key === 'href' && render === 'image') return out.src = link[key];
      out[key] = link[key];
    });
  });

  get('data', item, []).forEach(function(datum) {
    var name = get('name', datum);
    if (!name) return;

    doc[name] = Object.keys(datum).reduce(function(acc, key) {
      if (key === 'name') return acc;
      if (key === 'value') acc.data = datum[key];
      else acc[key] = datum[key];
      return acc;
    }, {});
  });

  if (template) doc.update = {
    enctype: 'application/collection+json',
    method: 'PUT',
    action: href,
    input: transformInputs(template, doc)
  }

  if (!isRoot) doc.delete = {
    method: 'DELETE',
    action: href
  };

  return doc;
}

/**
 * Transform CJ inputs into hyper rep, filling in any values
 *
 * @param {Array} inputs
 * @param {Object} values
 * @return {Object}
 */

function transformInputs(inputs, values) {
  var hyperInputs = {};
  inputs.forEach(mergeInput.bind(null, hyperInputs, values));
  return hyperInputs;
}

/**
 * Merge input into inputs
 *
 * @param {Object} inputs
 * @param {Object} values
 * @param {Object} input
 */

function mergeInput(inputs, values, input) {
  var name = get('name', input);
  if (!name) return;

  var out = inputs[name] = {};
  Object.keys(input).forEach(function(key) {
    if (key === 'name') return;
    if (!values || key !== 'value') return out[key] = input[key];
    var value = values[name];
    if (!value || typeof value !== 'object') return out.value = value;
    out.value = value.href || value.src || value.data;
  });
}

/**
 * Gracefully get a value
 *
 * @param {String} key
 * @param {Any} obj
 * @param {Any} fallback
 * @return {Any}
 */

function get(key, obj, fallback) {
  if (!obj) return undefined;
  if (obj.hasOwnProperty(key)) return obj[key];
  return fallback;
}

});

require.register("ng-hyper-cj", function (exports, module) {
/**
 * Module dependencies
 */

var angular = window.angular;
var cj2hyper = require('hypergroup~cj2hyper@0.1.1');

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

});

if (typeof exports == "object") {
  module.exports = require("ng-hyper-cj");
} else if (typeof define == "function" && define.amd) {
  define("ng-hyper-cj", [], function(){ return require("ng-hyper-cj"); });
} else {
  (this || window)["ng-hyper-cj"] = require("ng-hyper-cj");
}
})()
