/**
 * @file bin-utils.js
 */

/**
 * convert a TimeRange to text
 *
 * @param {TimeRange} range the timerange to use for conversion
 * @param {Number} i the iterator on the range to convert
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var textRange = function textRange(range, i) {
  return range.start(i) + '-' + range.end(i);
};

/**
 * format a number as hex string
 *
 * @param {Number} e The number
 * @param {Number} i the iterator
 */
var formatHexString = function formatHexString(e, i) {
  var value = e.toString(16);

  return '00'.substring(0, 2 - value.length) + value + (i % 2 ? ' ' : '');
};
var formatAsciiString = function formatAsciiString(e) {
  if (e >= 0x20 && e < 0x7e) {
    return String.fromCharCode(e);
  }
  return '.';
};

/**
 * utils to help dump binary data to the console
 */
var utils = {
  hexDump: function hexDump(data) {
    var bytes = Array.prototype.slice.call(data);
    var step = 16;
    var result = '';
    var hex = undefined;
    var ascii = undefined;

    for (var j = 0; j < bytes.length / step; j++) {
      hex = bytes.slice(j * step, j * step + step).map(formatHexString).join('');
      ascii = bytes.slice(j * step, j * step + step).map(formatAsciiString).join('');
      result += hex + ' ' + ascii + '\n';
    }
    return result;
  },
  tagDump: function tagDump(tag) {
    return utils.hexDump(tag.bytes);
  },
  textRanges: function textRanges(ranges) {
    var result = '';
    var i = undefined;

    for (i = 0; i < ranges.length; i++) {
      result += textRange(ranges, i) + ' ';
    }
    return result;
  }
};

exports['default'] = utils;
module.exports = exports['default'];