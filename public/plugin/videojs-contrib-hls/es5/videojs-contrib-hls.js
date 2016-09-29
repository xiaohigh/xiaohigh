/**
 * @file videojs-contrib-hls.js
 *
 * The main file for the HLS project.
 * License: https://github.com/videojs/videojs-contrib-hls/blob/master/LICENSE
 */
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _globalDocument = require('global/document');

var _globalDocument2 = _interopRequireDefault(_globalDocument);

var _playlistLoader = require('./playlist-loader');

var _playlistLoader2 = _interopRequireDefault(_playlistLoader);

var _playlist = require('./playlist');

var _playlist2 = _interopRequireDefault(_playlist);

var _xhr = require('./xhr');

var _xhr2 = _interopRequireDefault(_xhr);

var _aesDecrypter = require('aes-decrypter');

var _binUtils = require('./bin-utils');

var _binUtils2 = _interopRequireDefault(_binUtils);

var _videojsContribMediaSources = require('videojs-contrib-media-sources');

var _m3u8Parser = require('m3u8-parser');

var _m3u8Parser2 = _interopRequireDefault(_m3u8Parser);

var _videoJs = require('video.js');

var _videoJs2 = _interopRequireDefault(_videoJs);

var _masterPlaylistController = require('./master-playlist-controller');

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _renditionMixin = require('./rendition-mixin');

var _renditionMixin2 = _interopRequireDefault(_renditionMixin);

var _gapSkipper = require('./gap-skipper');

var _gapSkipper2 = _interopRequireDefault(_gapSkipper);

var _globalWindow = require('global/window');

var _globalWindow2 = _interopRequireDefault(_globalWindow);

var Hls = {
  PlaylistLoader: _playlistLoader2['default'],
  Playlist: _playlist2['default'],
  Decrypter: _aesDecrypter.Decrypter,
  AsyncStream: _aesDecrypter.AsyncStream,
  decrypt: _aesDecrypter.decrypt,
  utils: _binUtils2['default'],
  xhr: (0, _xhr2['default'])()
};

Object.defineProperty(Hls, 'GOAL_BUFFER_LENGTH', {
  get: function get() {
    _videoJs2['default'].log.warn('using Hls.GOAL_BUFFER_LENGTH is UNSAFE be sure ' + 'you know what you are doing');
    return _config2['default'].GOAL_BUFFER_LENGTH;
  },
  set: function set(v) {
    _videoJs2['default'].log.warn('using Hls.GOAL_BUFFER_LENGTH is UNSAFE be sure ' + 'you know what you are doing');
    if (typeof v !== 'number' || v <= 0) {
      _videoJs2['default'].log.warn('value passed to Hls.GOAL_BUFFER_LENGTH ' + 'must be a number and greater than 0');
      return;
    }
    _config2['default'].GOAL_BUFFER_LENGTH = v;
  }
});

// A fudge factor to apply to advertised playlist bitrates to account for
// temporary flucations in client bandwidth
var BANDWIDTH_VARIANCE = 1.2;

/**
 * Returns the CSS value for the specified property on an element
 * using `getComputedStyle`. Firefox has a long-standing issue where
 * getComputedStyle() may return null when running in an iframe with
 * `display: none`.
 *
 * @see https://bugzilla.mozilla.org/show_bug.cgi?id=548397
 * @param {HTMLElement} el the htmlelement to work on
 * @param {string} the proprety to get the style for
 */
var safeGetComputedStyle = function safeGetComputedStyle(el, property) {
  var result = undefined;

  if (!el) {
    return '';
  }

  result = _globalWindow2['default'].getComputedStyle(el);
  if (!result) {
    return '';
  }

  return result[property];
};

/**
 * Chooses the appropriate media playlist based on the current
 * bandwidth estimate and the player size.
 *
 * @return {Playlist} the highest bitrate playlist less than the currently detected
 * bandwidth, accounting for some amount of bandwidth variance
 */
Hls.STANDARD_PLAYLIST_SELECTOR = function () {
  var effectiveBitrate = undefined;
  var sortedPlaylists = this.playlists.master.playlists.slice();
  var bandwidthPlaylists = [];
  var now = +new Date();
  var i = undefined;
  var variant = undefined;
  var bandwidthBestVariant = undefined;
  var resolutionPlusOne = undefined;
  var resolutionPlusOneAttribute = undefined;
  var resolutionBestVariant = undefined;
  var width = undefined;
  var height = undefined;

  sortedPlaylists.sort(Hls.comparePlaylistBandwidth);

  // filter out any playlists that have been excluded due to
  // incompatible configurations or playback errors
  sortedPlaylists = sortedPlaylists.filter(function (localVariant) {
    if (typeof localVariant.excludeUntil !== 'undefined') {
      return now >= localVariant.excludeUntil;
    }
    return true;
  });

  // filter out any variant that has greater effective bitrate
  // than the current estimated bandwidth
  i = sortedPlaylists.length;
  while (i--) {
    variant = sortedPlaylists[i];

    // ignore playlists without bandwidth information
    if (!variant.attributes || !variant.attributes.BANDWIDTH) {
      continue;
    }

    effectiveBitrate = variant.attributes.BANDWIDTH * BANDWIDTH_VARIANCE;

    if (effectiveBitrate < this.bandwidth) {
      bandwidthPlaylists.push(variant);

      // since the playlists are sorted in ascending order by
      // bandwidth, the first viable variant is the best
      if (!bandwidthBestVariant) {
        bandwidthBestVariant = variant;
      }
    }
  }

  i = bandwidthPlaylists.length;

  // sort variants by resolution
  bandwidthPlaylists.sort(Hls.comparePlaylistResolution);

  // forget our old variant from above,
  // or we might choose that in high-bandwidth scenarios
  // (this could be the lowest bitrate rendition as  we go through all of them above)
  variant = null;

  width = parseInt(safeGetComputedStyle(this.tech_.el(), 'width'), 10);
  height = parseInt(safeGetComputedStyle(this.tech_.el(), 'height'), 10);

  // iterate through the bandwidth-filtered playlists and find
  // best rendition by player dimension
  while (i--) {
    variant = bandwidthPlaylists[i];

    // ignore playlists without resolution information
    if (!variant.attributes || !variant.attributes.RESOLUTION || !variant.attributes.RESOLUTION.width || !variant.attributes.RESOLUTION.height) {
      continue;
    }

    // since the playlists are sorted, the first variant that has
    // dimensions less than or equal to the player size is the best
    var variantResolution = variant.attributes.RESOLUTION;

    if (variantResolution.width === width && variantResolution.height === height) {
      // if we have the exact resolution as the player use it
      resolutionPlusOne = null;
      resolutionBestVariant = variant;
      break;
    } else if (variantResolution.width < width && variantResolution.height < height) {
      // if both dimensions are less than the player use the
      // previous (next-largest) variant
      break;
    } else if (!resolutionPlusOne || variantResolution.width < resolutionPlusOneAttribute.width && variantResolution.height < resolutionPlusOneAttribute.height) {
      // If we still haven't found a good match keep a
      // reference to the previous variant for the next loop
      // iteration

      // By only saving variants if they are smaller than the
      // previously saved variant, we ensure that we also pick
      // the highest bandwidth variant that is just-larger-than
      // the video player
      resolutionPlusOne = variant;
      resolutionPlusOneAttribute = resolutionPlusOne.attributes.RESOLUTION;
    }
  }

  // fallback chain of variants
  return resolutionPlusOne || resolutionBestVariant || bandwidthBestVariant || sortedPlaylists[0];
};

// HLS is a source handler, not a tech. Make sure attempts to use it
// as one do not cause exceptions.
Hls.canPlaySource = function () {
  return _videoJs2['default'].log.warn('HLS is no longer a tech. Please remove it from ' + 'your player\'s techOrder.');
};

/**
 * Whether the browser has built-in HLS support.
 */
Hls.supportsNativeHls = (function () {
  var video = _globalDocument2['default'].createElement('video');

  // native HLS is definitely not supported if HTML5 video isn't
  if (!_videoJs2['default'].getComponent('Html5').isSupported()) {
    return false;
  }

  // HLS manifests can go by many mime-types
  var canPlay = [
  // Apple santioned
  'application/vnd.apple.mpegurl',
  // Apple sanctioned for backwards compatibility
  'audio/mpegurl',
  // Very common
  'audio/x-mpegurl',
  // Very common
  'application/x-mpegurl',
  // Included for completeness
  'video/x-mpegurl', 'video/mpegurl', 'application/mpegurl'];

  return canPlay.some(function (canItPlay) {
    return (/maybe|probably/i.test(video.canPlayType(canItPlay))
    );
  });
})();

/**
 * HLS is a source handler, not a tech. Make sure attempts to use it
 * as one do not cause exceptions.
 */
Hls.isSupported = function () {
  return _videoJs2['default'].log.warn('HLS is no longer a tech. Please remove it from ' + 'your player\'s techOrder.');
};

var Component = _videoJs2['default'].getComponent('Component');

/**
 * The Hls Handler object, where we orchestrate all of the parts
 * of HLS to interact with video.js
 *
 * @class HlsHandler
 * @extends videojs.Component
 * @param {Object} source the soruce object
 * @param {Tech} tech the parent tech object
 * @param {Object} options optional and required options
 */

var HlsHandler = (function (_Component) {
  _inherits(HlsHandler, _Component);

  function HlsHandler(source, tech, options) {
    var _this = this;

    _classCallCheck(this, HlsHandler);

    _get(Object.getPrototypeOf(HlsHandler.prototype), 'constructor', this).call(this, tech);

    // tech.player() is deprecated but setup a reference to HLS for
    // backwards-compatibility
    if (tech.options_ && tech.options_.playerId) {
      var _player = (0, _videoJs2['default'])(tech.options_.playerId);

      if (!_player.hasOwnProperty('hls')) {
        Object.defineProperty(_player, 'hls', {
          get: function get() {
            _videoJs2['default'].log.warn('player.hls is deprecated. Use player.tech.hls instead.');
            return _this;
          }
        });
      }
    }

    this.tech_ = tech;
    this.source_ = source;
    this.stats = {};

    // handle global & Source Handler level options
    this.options_ = _videoJs2['default'].mergeOptions(_videoJs2['default'].options.hls || {}, options.hls);
    this.setOptions_();

    // listen for fullscreenchange events for this player so that we
    // can adjust our quality selection quickly
    this.on(_globalDocument2['default'], ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'], function (event) {
      var fullscreenElement = _globalDocument2['default'].fullscreenElement || _globalDocument2['default'].webkitFullscreenElement || _globalDocument2['default'].mozFullScreenElement || _globalDocument2['default'].msFullscreenElement;

      if (fullscreenElement && fullscreenElement.contains(_this.tech_.el())) {
        _this.masterPlaylistController_.fastQualityChange_();
      }
    });

    this.on(this.tech_, 'seeking', function () {
      this.setCurrentTime(this.tech_.currentTime());
    });
    this.on(this.tech_, 'error', function () {
      if (this.masterPlaylistController_) {
        this.masterPlaylistController_.pauseLoading();
      }
    });

    this.audioTrackChange_ = function () {
      _this.masterPlaylistController_.setupAudio();
    };

    this.on(this.tech_, 'play', this.play);
  }

  /**
   * The Source Handler object, which informs video.js what additional
   * MIME types are supported and sets up playback. It is registered
   * automatically to the appropriate tech based on the capabilities of
   * the browser it is running in. It is not necessary to use or modify
   * this object in normal usage.
   */

  _createClass(HlsHandler, [{
    key: 'setOptions_',
    value: function setOptions_() {
      var _this2 = this;

      // defaults
      this.options_.withCredentials = this.options_.withCredentials || false;

      // start playlist selection at a reasonable bandwidth for
      // broadband internet
      // 0.5 MB/s
      this.options_.bandwidth = this.options_.bandwidth || 4194304;

      // grab options passed to player.src
      ['withCredentials', 'bandwidth'].forEach(function (option) {
        if (typeof _this2.source_[option] !== 'undefined') {
          _this2.options_[option] = _this2.source_[option];
        }
      });

      this.bandwidth = this.options_.bandwidth;
    }

    /**
     * called when player.src gets called, handle a new source
     *
     * @param {Object} src the source object to handle
     */
  }, {
    key: 'src',
    value: function src(_src) {
      var _this3 = this;

      // do nothing if the src is falsey
      if (!_src) {
        return;
      }
      this.setOptions_();
      // add master playlist controller options
      this.options_.url = this.source_.src;
      this.options_.tech = this.tech_;
      this.options_.externHls = Hls;
      this.masterPlaylistController_ = new _masterPlaylistController.MasterPlaylistController(this.options_);
      this.gapSkipper_ = new _gapSkipper2['default'](this.options_);

      // `this` in selectPlaylist should be the HlsHandler for backwards
      // compatibility with < v2
      this.masterPlaylistController_.selectPlaylist = this.selectPlaylist ? this.selectPlaylist.bind(this) : Hls.STANDARD_PLAYLIST_SELECTOR.bind(this);

      // re-expose some internal objects for backwards compatibility with < v2
      this.playlists = this.masterPlaylistController_.masterPlaylistLoader_;
      this.mediaSource = this.masterPlaylistController_.mediaSource;

      // Proxy assignment of some properties to the master playlist
      // controller. Using a custom property for backwards compatibility
      // with < v2
      Object.defineProperties(this, {
        selectPlaylist: {
          get: function get() {
            return this.masterPlaylistController_.selectPlaylist;
          },
          set: function set(selectPlaylist) {
            this.masterPlaylistController_.selectPlaylist = selectPlaylist.bind(this);
          }
        },
        bandwidth: {
          get: function get() {
            return this.masterPlaylistController_.mainSegmentLoader_.bandwidth;
          },
          set: function set(bandwidth) {
            this.masterPlaylistController_.mainSegmentLoader_.bandwidth = bandwidth;
          }
        }
      });

      Object.defineProperties(this.stats, {
        bandwidth: {
          get: function get() {
            return _this3.bandwidth || 0;
          },
          enumerable: true
        },
        mediaRequests: {
          get: function get() {
            return _this3.masterPlaylistController_.mediaRequests_() || 0;
          },
          enumerable: true
        },
        mediaTransferDuration: {
          get: function get() {
            return _this3.masterPlaylistController_.mediaTransferDuration_() || 0;
          },
          enumerable: true
        },
        mediaBytesTransferred: {
          get: function get() {
            return _this3.masterPlaylistController_.mediaBytesTransferred_() || 0;
          },
          enumerable: true
        }
      });

      this.tech_.one('canplay', this.masterPlaylistController_.setupFirstPlay.bind(this.masterPlaylistController_));

      this.masterPlaylistController_.on('sourceopen', function () {
        _this3.tech_.audioTracks().addEventListener('change', _this3.audioTrackChange_);
      });

      this.masterPlaylistController_.on('selectedinitialmedia', function () {
        // Add the manual rendition mix-in to HlsHandler
        (0, _renditionMixin2['default'])(_this3);
      });

      this.masterPlaylistController_.on('audioupdate', function () {
        // clear current audioTracks
        _this3.tech_.clearTracks('audio');
        _this3.masterPlaylistController_.activeAudioGroup().forEach(function (audioTrack) {
          _this3.tech_.audioTracks().addTrack(audioTrack);
        });
      });

      // the bandwidth of the primary segment loader is our best
      // estimate of overall bandwidth
      this.on(this.masterPlaylistController_, 'progress', function () {
        this.bandwidth = this.masterPlaylistController_.mainSegmentLoader_.bandwidth;
        this.tech_.trigger('progress');
      });

      // do nothing if the tech has been disposed already
      // this can occur if someone sets the src in player.ready(), for instance
      if (!this.tech_.el()) {
        return;
      }

      this.tech_.src(_videoJs2['default'].URL.createObjectURL(this.masterPlaylistController_.mediaSource));
    }

    /**
     * a helper for grabbing the active audio group from MasterPlaylistController
     *
     * @private
     */
  }, {
    key: 'activeAudioGroup_',
    value: function activeAudioGroup_() {
      return this.masterPlaylistController_.activeAudioGroup();
    }

    /**
     * Begin playing the video.
     */
  }, {
    key: 'play',
    value: function play() {
      this.masterPlaylistController_.play();
    }

    /**
     * a wrapper around the function in MasterPlaylistController
     */
  }, {
    key: 'setCurrentTime',
    value: function setCurrentTime(currentTime) {
      this.masterPlaylistController_.setCurrentTime(currentTime);
    }

    /**
     * a wrapper around the function in MasterPlaylistController
     */
  }, {
    key: 'duration',
    value: function duration() {
      return this.masterPlaylistController_.duration();
    }

    /**
     * a wrapper around the function in MasterPlaylistController
     */
  }, {
    key: 'seekable',
    value: function seekable() {
      return this.masterPlaylistController_.seekable();
    }

    /**
    * Abort all outstanding work and cleanup.
    */
  }, {
    key: 'dispose',
    value: function dispose() {
      if (this.masterPlaylistController_) {
        this.masterPlaylistController_.dispose();
      }
      this.gapSkipper_.dispose();
      this.tech_.audioTracks().removeEventListener('change', this.audioTrackChange_);
      _get(Object.getPrototypeOf(HlsHandler.prototype), 'dispose', this).call(this);
    }
  }]);

  return HlsHandler;
})(Component);

var HlsSourceHandler = function HlsSourceHandler(mode) {
  return {
    canHandleSource: function canHandleSource(srcObj) {
      // this forces video.js to skip this tech/mode if its not the one we have been
      // overriden to use, by returing that we cannot handle the source.
      if (_videoJs2['default'].options.hls && _videoJs2['default'].options.hls.mode && _videoJs2['default'].options.hls.mode !== mode) {
        return false;
      }
      return HlsSourceHandler.canPlayType(srcObj.type);
    },
    handleSource: function handleSource(source, tech, options) {
      if (mode === 'flash') {
        // We need to trigger this asynchronously to give others the chance
        // to bind to the event when a source is set at player creation
        tech.setTimeout(function () {
          tech.trigger('loadstart');
        }, 1);
      }

      var settings = _videoJs2['default'].mergeOptions(options, { hls: { mode: mode } });

      tech.hls = new HlsHandler(source, tech, settings);

      tech.hls.xhr = (0, _xhr2['default'])();
      // Use a global `before` function if specified on videojs.Hls.xhr
      // but still allow for a per-player override
      if (_videoJs2['default'].Hls.xhr.beforeRequest) {
        tech.hls.xhr.beforeRequest = _videoJs2['default'].Hls.xhr.beforeRequest;
      }

      tech.hls.src(source.src);
      return tech.hls;
    },
    canPlayType: function canPlayType(type) {
      if (HlsSourceHandler.canPlayType(type)) {
        return 'maybe';
      }
      return '';
    }
  };
};

/**
 * A comparator function to sort two playlist object by bandwidth.
 *
 * @param {Object} left a media playlist object
 * @param {Object} right a media playlist object
 * @return {Number} Greater than zero if the bandwidth attribute of
 * left is greater than the corresponding attribute of right. Less
 * than zero if the bandwidth of right is greater than left and
 * exactly zero if the two are equal.
 */
Hls.comparePlaylistBandwidth = function (left, right) {
  var leftBandwidth = undefined;
  var rightBandwidth = undefined;

  if (left.attributes && left.attributes.BANDWIDTH) {
    leftBandwidth = left.attributes.BANDWIDTH;
  }
  leftBandwidth = leftBandwidth || _globalWindow2['default'].Number.MAX_VALUE;
  if (right.attributes && right.attributes.BANDWIDTH) {
    rightBandwidth = right.attributes.BANDWIDTH;
  }
  rightBandwidth = rightBandwidth || _globalWindow2['default'].Number.MAX_VALUE;

  return leftBandwidth - rightBandwidth;
};

/**
 * A comparator function to sort two playlist object by resolution (width).
 * @param {Object} left a media playlist object
 * @param {Object} right a media playlist object
 * @return {Number} Greater than zero if the resolution.width attribute of
 * left is greater than the corresponding attribute of right. Less
 * than zero if the resolution.width of right is greater than left and
 * exactly zero if the two are equal.
 */
Hls.comparePlaylistResolution = function (left, right) {
  var leftWidth = undefined;
  var rightWidth = undefined;

  if (left.attributes && left.attributes.RESOLUTION && left.attributes.RESOLUTION.width) {
    leftWidth = left.attributes.RESOLUTION.width;
  }

  leftWidth = leftWidth || _globalWindow2['default'].Number.MAX_VALUE;

  if (right.attributes && right.attributes.RESOLUTION && right.attributes.RESOLUTION.width) {
    rightWidth = right.attributes.RESOLUTION.width;
  }

  rightWidth = rightWidth || _globalWindow2['default'].Number.MAX_VALUE;

  // NOTE - Fallback to bandwidth sort as appropriate in cases where multiple renditions
  // have the same media dimensions/ resolution
  if (leftWidth === rightWidth && left.attributes.BANDWIDTH && right.attributes.BANDWIDTH) {
    return left.attributes.BANDWIDTH - right.attributes.BANDWIDTH;
  }
  return leftWidth - rightWidth;
};

HlsSourceHandler.canPlayType = function (type) {
  var mpegurlRE = /^(audio|video|application)\/(x-|vnd\.apple\.)?mpegurl/i;

  // favor native HLS support if it's available
  if (Hls.supportsNativeHls) {
    return false;
  }
  return mpegurlRE.test(type);
};

if (typeof _videoJs2['default'].MediaSource === 'undefined' || typeof _videoJs2['default'].URL === 'undefined') {
  _videoJs2['default'].MediaSource = _videojsContribMediaSources.MediaSource;
  _videoJs2['default'].URL = _videojsContribMediaSources.URL;
}

// register source handlers with the appropriate techs
if (_videojsContribMediaSources.MediaSource.supportsNativeMediaSources()) {
  _videoJs2['default'].getComponent('Html5').registerSourceHandler(HlsSourceHandler('html5'));
}
if (_globalWindow2['default'].Uint8Array) {
  _videoJs2['default'].getComponent('Flash').registerSourceHandler(HlsSourceHandler('flash'));
}

_videoJs2['default'].HlsHandler = HlsHandler;
_videoJs2['default'].HlsSourceHandler = HlsSourceHandler;
_videoJs2['default'].Hls = Hls;
_videoJs2['default'].m3u8 = _m3u8Parser2['default'];
_videoJs2['default'].registerComponent('Hls', Hls);
_videoJs2['default'].options.hls = _videoJs2['default'].options.hls || {};

module.exports = {
  Hls: Hls,
  HlsHandler: HlsHandler,
  HlsSourceHandler: HlsSourceHandler
};