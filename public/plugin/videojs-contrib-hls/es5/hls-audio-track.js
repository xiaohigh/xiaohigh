/**
 * @file hls-audio-track.js
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _videoJs = require('video.js');

var _playlistLoader = require('./playlist-loader');

var _playlistLoader2 = _interopRequireDefault(_playlistLoader);

/**
 * HlsAudioTrack extends video.js audio tracks but adds HLS
 * specific data storage such as playlist loaders, mediaGroups
 * and default/autoselect
 *
 * @param {Object} options options to create HlsAudioTrack with
 * @class HlsAudioTrack
 * @extends AudioTrack
 */

var HlsAudioTrack = (function (_AudioTrack) {
  _inherits(HlsAudioTrack, _AudioTrack);

  function HlsAudioTrack(options) {
    _classCallCheck(this, HlsAudioTrack);

    _get(Object.getPrototypeOf(HlsAudioTrack.prototype), 'constructor', this).call(this, {
      kind: options['default'] ? 'main' : 'alternative',
      enabled: options['default'] || false,
      language: options.language,
      label: options.label
    });

    this.hls = options.hls;
    this.autoselect = options.autoselect || false;
    this['default'] = options['default'] || false;
    this.withCredentials = options.withCredentials || false;
    this.mediaGroups_ = [];
    this.addLoader(options.mediaGroup, options.resolvedUri);
  }

  /**
   * get a PlaylistLoader from this track given a mediaGroup name
   *
   * @param {String} mediaGroup the mediaGroup to get the loader for
   * @return {PlaylistLoader|Null} the PlaylistLoader or null
   */

  _createClass(HlsAudioTrack, [{
    key: 'getLoader',
    value: function getLoader(mediaGroup) {
      for (var i = 0; i < this.mediaGroups_.length; i++) {
        var mgl = this.mediaGroups_[i];

        if (mgl.mediaGroup === mediaGroup) {
          return mgl.loader;
        }
      }
    }

    /**
     * add a PlaylistLoader given a mediaGroup, and a uri. for a combined track
     * we store null for the playlistloader
     *
     * @param {String} mediaGroup the mediaGroup to get the loader for
     * @param {String} uri the uri to get the audio track/mediaGroup from
     */
  }, {
    key: 'addLoader',
    value: function addLoader(mediaGroup) {
      var uri = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

      var loader = null;

      if (uri) {
        // TODO: this should probably happen upstream in Master Playlist
        // Controller when we can switch PlaylistLoader sources
        // then we can just store the uri here instead
        loader = new _playlistLoader2['default'](uri, this.hls, this.withCredentials);
      }
      this.mediaGroups_.push({ mediaGroup: mediaGroup, loader: loader });
    }

    /**
     * remove a playlist loader from a track given the mediaGroup
     *
     * @param {String} mediaGroup the mediaGroup to remove
     */
  }, {
    key: 'removeLoader',
    value: function removeLoader(mediaGroup) {
      for (var i = 0; i < this.mediaGroups_.length; i++) {
        var mgl = this.mediaGroups_[i];

        if (mgl.mediaGroup === mediaGroup) {
          if (mgl.loader) {
            mgl.loader.dispose();
          }
          this.mediaGroups_.splice(i, 1);
          return;
        }
      }
    }

    /**
     * Dispose of this audio track and
     * the playlist loader that it holds inside
     */
  }, {
    key: 'dispose',
    value: function dispose() {
      var i = this.mediaGroups_.length;

      while (i--) {
        this.removeLoader(this.mediaGroups_[i].mediaGroup);
      }
    }
  }]);

  return HlsAudioTrack;
})(_videoJs.AudioTrack);

exports['default'] = HlsAudioTrack;
module.exports = exports['default'];