/**
 * @file resolve-url.js
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _globalDocument = require('global/document');

var _globalDocument2 = _interopRequireDefault(_globalDocument);

/**
 * Constructs a new URI by interpreting a path relative to another
 * URI.
 *
 * @see http://stackoverflow.com/questions/470832/getting-an-absolute-url-from-a-relative-one-ie6-issue
 * @param {String} basePath a relative or absolute URI
 * @param {String} path a path part to combine with the base
 * @return {String} a URI that is equivalent to composing `base`
 * with `path`
 */
var resolveUrl = function resolveUrl(basePath, path) {
  // use the base element to get the browser to handle URI resolution
  var oldBase = _globalDocument2['default'].querySelector('base');
  var docHead = _globalDocument2['default'].querySelector('head');
  var a = _globalDocument2['default'].createElement('a');
  var base = oldBase;
  var oldHref = undefined;
  var result = undefined;

  // prep the document
  if (oldBase) {
    oldHref = oldBase.href;
  } else {
    base = docHead.appendChild(_globalDocument2['default'].createElement('base'));
  }

  base.href = basePath;
  a.href = path;
  result = a.href;

  // clean up
  if (oldBase) {
    oldBase.href = oldHref;
  } else {
    docHead.removeChild(base);
  }
  return result;
};

exports['default'] = resolveUrl;
module.exports = exports['default'];