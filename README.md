ng-hyper-cj
===========

Collection+JSON extension to ng-hyper

Installation
------------

### component

```sh
$ component install hypergroup/ng-hyper-cj
```

### standalone

* [standalone](ng-hyper-cj.js)
* [minified](ng-hyper-cj.min.js)

`NOTE` a version of [ng-hyper](https://github.com/hypergroup/ng-hyper) is required as a dependency

Usage
-----

```js
angular.module('myApp', ['ng-hyper', 'ng-hyper-cj']);
```

`ng-hyper-cj` will register a `$http` interceptor and translate and Collection+JSON documents into hyper+json. This allows CJ users to take advantage of the hyper tooling.

For more usage docs, check out [ng-hyper](https://github.com/hypergroup/ng-hyper).
