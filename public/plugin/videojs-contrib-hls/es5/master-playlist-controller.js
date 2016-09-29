/**
 * @file master-playlist-controller.js
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x3, _x4, _x5) { var _again = true; _function: while (_again) { var object = _x3, property = _x4, receiver = _x5; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x3 = parent; _x4 = property; _x5 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _playlistLoader = require('./playlist-loader');

var _playlistLoader2 = _interopRequireDefault(_playlistLoader);

var _segmentLoader = require('./segment-loader');

var _segmentLoader2 = _interopRequireDefault(_segmentLoader);

var _ranges = require('./ranges');

var _ranges2 = _interopRequireDefault(_ranges);

var _videoJs = require('video.js');

var _videoJs2 = _interopRequireDefault(_videoJs);

var _adCueTags = require('./ad-cue-tags');

var _adCueTags2 = _interopRequireDefault(_adCueTags);

// 5 minute blacklist
var BLACKLIST_DURATION = 5 * 60 * 1000;
var Hls = undefined;

/**
 * determine if an object a is differnt from
 * and object b. both only having one dimensional
 * properties
 *
 * @param {Object} a object one
 * @param {Object} b object two
 * @return {Boolean} if the object has changed or not
 */
var objectChanged = function objectChanged(a, b) {
  if (typeof a !== typeof b) {
    return true;
  }
  // if we have a different number of elements
  // something has changed
  if (Object.keys(a).length !== Object.keys(b).length) {
    return true;
  }

  for (var prop in a) {
    if (a[prop] !== b[prop]) {
      return true;
    }
  }
  return false;
};

/**
 * Parses a codec string to retrieve the number of codecs specified,
 * the video codec and object type indicator, and the audio profile.
 *
 * @private
 */
var parseCodecs = function parseCodecs(codecs) {
  var result = {
    codecCount: 0,
    videoCodec: null,
    videoObjectTypeIndicator: null,
    audioProfile: null
  };
  var parsed = undefined;

  result.codecCount = codecs.split(',').length;
  result.codecCount = result.codecCount || 2;

  // parse the video codec
  parsed = /(^|\s|,)+(avc1)([^ ,]*)/i.exec(codecs);
  if (parsed) {
    result.videoCodec = parsed[2];
    result.videoObjectTypeIndicator = parsed[3];
  }

  // parse the last field of the audio codec
  result.audioProfile = /(^|\s|,)+mp4a.[0-9A-Fa-f]+\.([0-9A-Fa-f]+)/i.exec(codecs);
  result.audioProfile = result.audioProfile && result.audioProfile[2];

  return result;
};

/**
 * Calculates the MIME type strings for a working configuration of
 * SourceBuffers to play variant streams in a master playlist. If
 * there is no possible working configuration, an empty array will be
 * returned.
 *
 * @param master {Object} the m3u8 object for the master playlist
 * @param media {Object} the m3u8 object for the variant playlist
 * @return {Array} the MIME type strings. If the array has more than
 * one entry, the first element should be applied to the video
 * SourceBuffer and the second to the audio SourceBuffer.
 *
 * @private
 */
var mimeTypesForPlaylist_ = function mimeTypesForPlaylist_(master, media) {
  var container = 'mp2t';
  var codecs = {
    videoCodec: 'avc1',
    videoObjectTypeIndicator: '.4d400d',
    audioProfile: '2'
  };
  var audioGroup = [];
  var mediaAttributes = undefined;
  var previousGroup = null;

  if (!media) {
    // not enough information, return an error
    return [];
  }
  // An initialization segment means the media playlists is an iframe
  // playlist or is using the mp4 container. We don't currently
  // support iframe playlists, so assume this is signalling mp4
  // fragments.
  // the existence check for segments can be removed once
  // https://github.com/videojs/m3u8-parser/issues/8 is closed
  if (media.segments && media.segments.length && media.segments[0].map) {
    container = 'mp4';
  }

  // if the codecs were explicitly specified, use them instead of the
  // defaults
  mediaAttributes = media.attributes || {};
  if (mediaAttributes.CODECS) {
    (function () {
      var parsedCodecs = parseCodecs(mediaAttributes.CODECS);

      Object.keys(parsedCodecs).forEach(function (key) {
        codecs[key] = parsedCodecs[key] || codecs[key];
      });
    })();
  }

  if (master.mediaGroups.AUDIO) {
    audioGroup = master.mediaGroups.AUDIO[mediaAttributes.AUDIO];
  }

  // if audio could be muxed or unmuxed, use mime types appropriate
  // for both scenarios
  for (var groupId in audioGroup) {
    if (previousGroup && !!audioGroup[groupId].uri !== !!previousGroup.uri) {
      // one source buffer with muxed video and audio and another for
      // the alternate audio
      return ['video/' + container + '; codecs="' + codecs.videoCodec + codecs.videoObjectTypeIndicator + ', mp4a.40.' + codecs.audioProfile + '"', 'audio/' + container + '; codecs="mp4a.40.' + codecs.audioProfile + '"'];
    }
    previousGroup = audioGroup[groupId];
  }
  // if all video and audio is unmuxed, use two single-codec mime
  // types
  if (previousGroup && previousGroup.uri) {
    return ['video/' + container + '; codecs="' + codecs.videoCodec + codecs.videoObjectTypeIndicator + '"', 'audio/' + container + '; codecs="mp4a.40.' + codecs.audioProfile + '"'];
  }

  // all video and audio are muxed, use a dual-codec mime type
  return ['video/' + container + '; codecs="' + codecs.videoCodec + codecs.videoObjectTypeIndicator + ', mp4a.40.' + codecs.audioProfile + '"'];
};

exports.mimeTypesForPlaylist_ = mimeTypesForPlaylist_;
/**
 * the master playlist controller controller all interactons
 * between playlists and segmentloaders. At this time this mainly
 * involves a master playlist and a series of audio playlists
 * if they are available
 *
 * @class MasterPlaylistController
 * @extends videojs.EventTarget
 */

var MasterPlaylistController = (function (_videojs$EventTarget) {
  _inherits(MasterPlaylistController, _videojs$EventTarget);

  function MasterPlaylistController(options) {
    var _this = this;

    _classCallCheck(this, MasterPlaylistController);

    _get(Object.getPrototypeOf(MasterPlaylistController.prototype), 'constructor', this).call(this);

    var url = options.url;
    var withCredentials = options.withCredentials;
    var mode = options.mode;
    var tech = options.tech;
    var bandwidth = options.bandwidth;
    var externHls = options.externHls;
    var useCueTags = options.useCueTags;

    if (!url) {
      throw new Error('A non-empty playlist URL is required');
    }

    Hls = externHls;

    this.withCredentials = withCredentials;
    this.tech_ = tech;
    this.hls_ = tech.hls;
    this.mode_ = mode;
    this.useCueTags_ = useCueTags;
    if (this.useCueTags_) {
      this.cueTagsTrack_ = this.tech_.addTextTrack('metadata', 'ad-cues');
      this.cueTagsTrack_.inBandMetadataTrackDispatchType = '';
      this.tech_.textTracks().addTrack_(this.cueTagsTrack_);
    }

    this.audioTracks_ = [];
    this.requestOptions_ = {
      withCredentials: this.withCredentials,
      timeout: null
    };

    this.audioGroups_ = {};

    this.mediaSource = new _videoJs2['default'].MediaSource({ mode: mode });
    this.audioinfo_ = null;
    this.mediaSource.on('audioinfo', this.handleAudioinfoUpdate_.bind(this));

    // load the media source into the player
    this.mediaSource.addEventListener('sourceopen', this.handleSourceOpen_.bind(this));

    var segmentLoaderOptions = {
      hls: this.hls_,
      mediaSource: this.mediaSource,
      currentTime: this.tech_.currentTime.bind(this.tech_),
      seekable: function seekable() {
        return _this.seekable();
      },
      seeking: function seeking() {
        return _this.tech_.seeking();
      },
      setCurrentTime: function setCurrentTime(a) {
        return _this.tech_.setCurrentTime(a);
      },
      hasPlayed: function hasPlayed() {
        return _this.tech_.played().length !== 0;
      },
      bandwidth: bandwidth
    };

    // setup playlist loaders
    this.masterPlaylistLoader_ = new _playlistLoader2['default'](url, this.hls_, this.withCredentials);
    this.setupMasterPlaylistLoaderListeners_();
    this.audioPlaylistLoader_ = null;

    // setup segment loaders
    // combined audio/video or just video when alternate audio track is selected
    this.mainSegmentLoader_ = new _segmentLoader2['default'](segmentLoaderOptions);
    // alternate audio track
    this.audioSegmentLoader_ = new _segmentLoader2['default'](segmentLoaderOptions);
    this.setupSegmentLoaderListeners_();

    this.masterPlaylistLoader_.start();
  }

  /**
   * Register event handlers on the master playlist loader. A helper
   * function for construction time.
   *
   * @private
   */

  _createClass(MasterPlaylistController, [{
    key: 'setupMasterPlaylistLoaderListeners_',
    value: function setupMasterPlaylistLoaderListeners_() {
      var _this2 = this;

      this.masterPlaylistLoader_.on('loadedmetadata', function () {
        var media = _this2.masterPlaylistLoader_.media();
        var requestTimeout = _this2.masterPlaylistLoader_.targetDuration * 1.5 * 1000;

        _this2.requestOptions_.timeout = requestTimeout;

        // if this isn't a live video and preload permits, start
        // downloading segments
        if (media.endList && _this2.tech_.preload() !== 'none') {
          _this2.mainSegmentLoader_.playlist(media, _this2.requestOptions_);
          _this2.mainSegmentLoader_.expired(_this2.masterPlaylistLoader_.expired_);
          _this2.mainSegmentLoader_.load();
        }

        try {
          _this2.setupSourceBuffers_();
        } catch (e) {
          _videoJs2['default'].log.warn('Failed to create SourceBuffers', e);
          return _this2.mediaSource.endOfStream('decode');
        }
        _this2.setupFirstPlay();

        _this2.fillAudioTracks_();
        _this2.setupAudio();
        _this2.trigger('audioupdate');

        _this2.trigger('selectedinitialmedia');
      });

      this.masterPlaylistLoader_.on('loadedplaylist', function () {
        var updatedPlaylist = _this2.masterPlaylistLoader_.media();
        var seekable = undefined;

        if (!updatedPlaylist) {
          // select the initial variant
          _this2.initialMedia_ = _this2.selectPlaylist();
          _this2.masterPlaylistLoader_.media(_this2.initialMedia_);
          return;
        }

        if (_this2.useCueTags_) {
          _this2.updateAdCues_(updatedPlaylist, _this2.masterPlaylistLoader_.expired_);
        }

        // TODO: Create a new event on the PlaylistLoader that signals
        // that the segments have changed in some way and use that to
        // update the SegmentLoader instead of doing it twice here and
        // on `mediachange`
        _this2.mainSegmentLoader_.playlist(updatedPlaylist, _this2.requestOptions_);
        _this2.mainSegmentLoader_.expired(_this2.masterPlaylistLoader_.expired_);
        _this2.updateDuration();

        // update seekable
        seekable = _this2.seekable();
        if (!updatedPlaylist.endList && seekable.length !== 0) {
          _this2.mediaSource.addSeekableRange_(seekable.start(0), seekable.end(0));
        }
      });

      this.masterPlaylistLoader_.on('error', function () {
        _this2.blacklistCurrentPlaylist(_this2.masterPlaylistLoader_.error);
      });

      this.masterPlaylistLoader_.on('mediachanging', function () {
        _this2.mainSegmentLoader_.abort();
        _this2.mainSegmentLoader_.pause();
      });

      this.masterPlaylistLoader_.on('mediachange', function () {
        var media = _this2.masterPlaylistLoader_.media();
        var requestTimeout = _this2.masterPlaylistLoader_.targetDuration * 1.5 * 1000;
        var activeAudioGroup = undefined;
        var activeTrack = undefined;

        // If we don't have any more available playlists, we don't want to
        // timeout the request.
        if (_this2.masterPlaylistLoader_.isLowestEnabledRendition_()) {
          _this2.requestOptions_.timeout = 0;
        } else {
          _this2.requestOptions_.timeout = requestTimeout;
        }

        // TODO: Create a new event on the PlaylistLoader that signals
        // that the segments have changed in some way and use that to
        // update the SegmentLoader instead of doing it twice here and
        // on `loadedplaylist`
        _this2.mainSegmentLoader_.playlist(media, _this2.requestOptions_);
        _this2.mainSegmentLoader_.expired(_this2.masterPlaylistLoader_.expired_);
        _this2.mainSegmentLoader_.load();

        // if the audio group has changed, a new audio track has to be
        // enabled
        activeAudioGroup = _this2.activeAudioGroup();
        activeTrack = activeAudioGroup.filter(function (track) {
          return track.enabled;
        })[0];
        if (!activeTrack) {
          _this2.setupAudio();
          _this2.trigger('audioupdate');
        }

        _this2.tech_.trigger({
          type: 'mediachange',
          bubbles: true
        });
      });
    }

    /**
     * Register event handlers on the segment loaders. A helper function
     * for construction time.
     *
     * @private
     */
  }, {
    key: 'setupSegmentLoaderListeners_',
    value: function setupSegmentLoaderListeners_() {
      var _this3 = this;

      this.mainSegmentLoader_.on('progress', function () {
        // figure out what stream the next segment should be downloaded from
        // with the updated bandwidth information
        _this3.masterPlaylistLoader_.media(_this3.selectPlaylist());

        _this3.trigger('progress');
      });

      this.mainSegmentLoader_.on('error', function () {
        _this3.blacklistCurrentPlaylist(_this3.mainSegmentLoader_.error());
      });

      this.audioSegmentLoader_.on('error', function () {
        _videoJs2['default'].log.warn('Problem encountered with the current alternate audio track' + '. Switching back to default.');
        _this3.audioSegmentLoader_.abort();
        _this3.audioPlaylistLoader_ = null;
        _this3.setupAudio();
      });
    }
  }, {
    key: 'handleAudioinfoUpdate_',
    value: function handleAudioinfoUpdate_(event) {
      if (!_videoJs2['default'].browser.IS_FIREFOX || !this.audioInfo_ || !objectChanged(this.audioInfo_, event.info)) {
        this.audioInfo_ = event.info;
        return;
      }

      var error = 'had different audio properties (channels, sample rate, etc.) ' + 'or changed in some other way.  This behavior is currently ' + 'unsupported in Firefox due to an issue: \n\n' + 'https://bugzilla.mozilla.org/show_bug.cgi?id=1247138\n\n';

      var enabledIndex = this.activeAudioGroup().map(function (track) {
        return track.enabled;
      }).indexOf(true);
      var enabledTrack = this.activeAudioGroup()[enabledIndex];
      var defaultTrack = this.activeAudioGroup().filter(function (track) {
        return track.properties_ && track.properties_['default'];
      })[0];

      // they did not switch audiotracks
      // blacklist the current playlist
      if (!this.audioPlaylistLoader_) {
        error = 'The rendition that we tried to switch to ' + error + 'Unfortunately that means we will have to blacklist ' + 'the current playlist and switch to another. Sorry!';
        this.blacklistCurrentPlaylist();
      } else {
        error = 'The audio track \'' + enabledTrack.label + '\' that we tried to ' + ('switch to ' + error + ' Unfortunately this means we will have to ') + ('return you to the main track \'' + defaultTrack.label + '\'. Sorry!');
        defaultTrack.enabled = true;
        this.activeAudioGroup().splice(enabledIndex, 1);
        this.trigger('audioupdate');
      }

      _videoJs2['default'].log.warn(error);
      this.setupAudio();
    }

    /**
     * get the total number of media requests from the `audiosegmentloader_`
     * and the `mainSegmentLoader_`
     *
     * @private
     */
  }, {
    key: 'mediaRequests_',
    value: function mediaRequests_() {
      return this.audioSegmentLoader_.mediaRequests + this.mainSegmentLoader_.mediaRequests;
    }

    /**
     * get the total time that media requests have spent trnasfering
     * from the `audiosegmentloader_` and the `mainSegmentLoader_`
     *
     * @private
     */
  }, {
    key: 'mediaTransferDuration_',
    value: function mediaTransferDuration_() {
      return this.audioSegmentLoader_.mediaTransferDuration + this.mainSegmentLoader_.mediaTransferDuration;
    }

    /**
     * get the total number of bytes transfered during media requests
     * from the `audiosegmentloader_` and the `mainSegmentLoader_`
     *
     * @private
     */
  }, {
    key: 'mediaBytesTransferred_',
    value: function mediaBytesTransferred_() {
      return this.audioSegmentLoader_.mediaBytesTransferred + this.mainSegmentLoader_.mediaBytesTransferred;
    }

    /**
     * fill our internal list of HlsAudioTracks with data from
     * the master playlist or use a default
     *
     * @private
     */
  }, {
    key: 'fillAudioTracks_',
    value: function fillAudioTracks_() {
      var master = this.master();
      var mediaGroups = master.mediaGroups || {};

      // force a default if we have none or we are not
      // in html5 mode (the only mode to support more than one
      // audio track)
      if (!mediaGroups || !mediaGroups.AUDIO || Object.keys(mediaGroups.AUDIO).length === 0 || this.mode_ !== 'html5') {
        // "main" audio group, track name "default"
        mediaGroups.AUDIO = { main: { 'default': { 'default': true } } };
      }

      for (var mediaGroup in mediaGroups.AUDIO) {
        if (!this.audioGroups_[mediaGroup]) {
          this.audioGroups_[mediaGroup] = [];
        }

        for (var label in mediaGroups.AUDIO[mediaGroup]) {
          var properties = mediaGroups.AUDIO[mediaGroup][label];
          var track = new _videoJs2['default'].AudioTrack({
            id: label,
            kind: properties['default'] ? 'main' : 'alternative',
            enabled: false,
            language: properties.language,
            label: label
          });

          track.properties_ = properties;
          this.audioGroups_[mediaGroup].push(track);
        }
      }

      // enable the default active track
      (this.activeAudioGroup().filter(function (audioTrack) {
        return audioTrack.properties_['default'];
      })[0] || this.activeAudioGroup()[0]).enabled = true;
    }

    /**
     * Call load on our SegmentLoaders
     */
  }, {
    key: 'load',
    value: function load() {
      this.mainSegmentLoader_.load();
      if (this.audioPlaylistLoader_) {
        this.audioSegmentLoader_.load();
      }
    }

    /**
     * Returns the audio group for the currently active primary
     * media playlist.
     */
  }, {
    key: 'activeAudioGroup',
    value: function activeAudioGroup() {
      var videoPlaylist = this.masterPlaylistLoader_.media();
      var result = undefined;

      if (videoPlaylist.attributes && videoPlaylist.attributes.AUDIO) {
        result = this.audioGroups_[videoPlaylist.attributes.AUDIO];
      }

      return result || this.audioGroups_.main;
    }

    /**
     * Determine the correct audio rendition based on the active
     * AudioTrack and initialize a PlaylistLoader and SegmentLoader if
     * necessary. This method is called once automatically before
     * playback begins to enable the default audio track and should be
     * invoked again if the track is changed.
     */
  }, {
    key: 'setupAudio',
    value: function setupAudio() {
      var _this4 = this;

      // determine whether seperate loaders are required for the audio
      // rendition
      var audioGroup = this.activeAudioGroup();
      var track = audioGroup.filter(function (audioTrack) {
        return audioTrack.enabled;
      })[0];

      if (!track) {
        track = audioGroup.filter(function (audioTrack) {
          return audioTrack.properties_['default'];
        })[0] || audioGroup[0];
        track.enabled = true;
      }

      // stop playlist and segment loading for audio
      if (this.audioPlaylistLoader_) {
        this.audioPlaylistLoader_.dispose();
        this.audioPlaylistLoader_ = null;
      }
      this.audioSegmentLoader_.pause();
      this.audioSegmentLoader_.clearBuffer();

      if (!track.properties_.resolvedUri) {
        return;
      }

      // startup playlist and segment loaders for the enabled audio
      // track
      this.audioPlaylistLoader_ = new _playlistLoader2['default'](track.properties_.resolvedUri, this.hls_, this.withCredentials);
      this.audioPlaylistLoader_.start();

      this.audioPlaylistLoader_.on('loadedmetadata', function () {
        var audioPlaylist = _this4.audioPlaylistLoader_.media();

        _this4.audioSegmentLoader_.playlist(audioPlaylist, _this4.requestOptions_);

        // if the video is already playing, or if this isn't a live video and preload
        // permits, start downloading segments
        if (!_this4.tech_.paused() || audioPlaylist.endList && _this4.tech_.preload() !== 'none') {
          _this4.audioSegmentLoader_.load();
        }

        if (!audioPlaylist.endList) {
          // trigger the playlist loader to start "expired time"-tracking
          _this4.audioPlaylistLoader_.trigger('firstplay');
        }
      });

      this.audioPlaylistLoader_.on('loadedplaylist', function () {
        var updatedPlaylist = undefined;

        if (_this4.audioPlaylistLoader_) {
          updatedPlaylist = _this4.audioPlaylistLoader_.media();
        }

        if (!updatedPlaylist) {
          // only one playlist to select
          _this4.audioPlaylistLoader_.media(_this4.audioPlaylistLoader_.playlists.master.playlists[0]);
          return;
        }

        _this4.audioSegmentLoader_.playlist(updatedPlaylist, _this4.requestOptions_);
      });

      this.audioPlaylistLoader_.on('error', function () {
        _videoJs2['default'].log.warn('Problem encountered loading the alternate audio track' + '. Switching back to default.');
        _this4.audioSegmentLoader_.abort();
        _this4.setupAudio();
      });
    }

    /**
     * Re-tune playback quality level for the current player
     * conditions. This method may perform destructive actions, like
     * removing already buffered content, to readjust the currently
     * active playlist quickly.
     *
     * @private
     */
  }, {
    key: 'fastQualityChange_',
    value: function fastQualityChange_() {
      var media = this.selectPlaylist();

      if (media !== this.masterPlaylistLoader_.media()) {
        this.masterPlaylistLoader_.media(media);
        this.mainSegmentLoader_.sourceUpdater_.remove(this.tech_.currentTime() + 5, Infinity);
      }
    }

    /**
     * Begin playback.
     */
  }, {
    key: 'play',
    value: function play() {
      if (this.setupFirstPlay()) {
        return;
      }

      if (this.tech_.ended()) {
        this.tech_.setCurrentTime(0);
      }

      this.load();

      // if the viewer has paused and we fell out of the live window,
      // seek forward to the earliest available position
      if (this.tech_.duration() === Infinity) {
        if (this.tech_.currentTime() < this.tech_.seekable().start(0)) {
          return this.tech_.setCurrentTime(this.tech_.seekable().start(0));
        }
      }
    }

    /**
     * Seek to the latest media position if this is a live video and the
     * player and video are loaded and initialized.
     */
  }, {
    key: 'setupFirstPlay',
    value: function setupFirstPlay() {
      var seekable = undefined;
      var media = this.masterPlaylistLoader_.media();

      // check that everything is ready to begin buffering
      // 1) the active media playlist is available
      if (media &&
      // 2) the video is a live stream
      !media.endList &&

      // 3) the player is not paused
      !this.tech_.paused() &&

      // 4) the player has not started playing
      !this.hasPlayed_) {

        // trigger the playlist loader to start "expired time"-tracking
        this.masterPlaylistLoader_.trigger('firstplay');
        this.hasPlayed_ = true;

        // seek to the latest media position for live videos
        seekable = this.seekable();
        if (seekable.length) {
          this.tech_.setCurrentTime(seekable.end(0));
        }

        // now that we seeked to the current time, load the segment
        this.load();

        return true;
      }
      return false;
    }

    /**
     * handle the sourceopen event on the MediaSource
     *
     * @private
     */
  }, {
    key: 'handleSourceOpen_',
    value: function handleSourceOpen_() {
      // Only attempt to create the source buffer if none already exist.
      // handleSourceOpen is also called when we are "re-opening" a source buffer
      // after `endOfStream` has been called (in response to a seek for instance)
      try {
        this.setupSourceBuffers_();
      } catch (e) {
        _videoJs2['default'].log.warn('Failed to create Source Buffers', e);
        return this.mediaSource.endOfStream('decode');
      }

      // if autoplay is enabled, begin playback. This is duplicative of
      // code in video.js but is required because play() must be invoked
      // *after* the media source has opened.
      if (this.tech_.autoplay()) {
        this.tech_.play();
      }

      this.trigger('sourceopen');
    }

    /**
     * Blacklists a playlist when an error occurs for a set amount of time
     * making it unavailable for selection by the rendition selection algorithm
     * and then forces a new playlist (rendition) selection.
     *
     * @param {Object=} error an optional error that may include the playlist
     * to blacklist
     */
  }, {
    key: 'blacklistCurrentPlaylist',
    value: function blacklistCurrentPlaylist() {
      var error = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var currentPlaylist = undefined;
      var nextPlaylist = undefined;

      // If the `error` was generated by the playlist loader, it will contain
      // the playlist we were trying to load (but failed) and that should be
      // blacklisted instead of the currently selected playlist which is likely
      // out-of-date in this scenario
      currentPlaylist = error.playlist || this.masterPlaylistLoader_.media();

      // If there is no current playlist, then an error occurred while we were
      // trying to load the master OR while we were disposing of the tech
      if (!currentPlaylist) {
        this.error = error;
        return this.mediaSource.endOfStream('network');
      }

      // Blacklist this playlist
      currentPlaylist.excludeUntil = Date.now() + BLACKLIST_DURATION;

      // Select a new playlist
      nextPlaylist = this.selectPlaylist();

      if (nextPlaylist) {
        _videoJs2['default'].log.warn('Problem encountered with the current ' + 'HLS playlist. Switching to another playlist.');

        return this.masterPlaylistLoader_.media(nextPlaylist);
      }
      _videoJs2['default'].log.warn('Problem encountered with the current ' + 'HLS playlist. No suitable alternatives found.');
      // We have no more playlists we can select so we must fail
      this.error = error;
      return this.mediaSource.endOfStream('network');
    }

    /**
     * Pause all segment loaders
     */
  }, {
    key: 'pauseLoading',
    value: function pauseLoading() {
      this.mainSegmentLoader_.pause();
      if (this.audioPlaylistLoader_) {
        this.audioSegmentLoader_.pause();
      }
    }

    /**
     * set the current time on all segment loaders
     *
     * @param {TimeRange} currentTime the current time to set
     * @return {TimeRange} the current time
     */
  }, {
    key: 'setCurrentTime',
    value: function setCurrentTime(currentTime) {
      var buffered = _ranges2['default'].findRange(this.tech_.buffered(), currentTime);

      if (!(this.masterPlaylistLoader_ && this.masterPlaylistLoader_.media())) {
        // return immediately if the metadata is not ready yet
        return 0;
      }

      // it's clearly an edge-case but don't thrown an error if asked to
      // seek within an empty playlist
      if (!this.masterPlaylistLoader_.media().segments) {
        return 0;
      }

      // if the seek location is already buffered, continue buffering as
      // usual
      if (buffered && buffered.length) {
        return currentTime;
      }

      // cancel outstanding requests so we begin buffering at the new
      // location
      this.mainSegmentLoader_.abort();
      if (this.audioPlaylistLoader_) {
        this.audioSegmentLoader_.abort();
      }

      if (!this.tech_.paused()) {
        this.mainSegmentLoader_.load();
        if (this.audioPlaylistLoader_) {
          this.audioSegmentLoader_.load();
        }
      }
    }

    /**
     * get the current duration
     *
     * @return {TimeRange} the duration
     */
  }, {
    key: 'duration',
    value: function duration() {
      if (!this.masterPlaylistLoader_) {
        return 0;
      }

      if (this.mediaSource) {
        return this.mediaSource.duration;
      }

      return Hls.Playlist.duration(this.masterPlaylistLoader_.media());
    }

    /**
     * check the seekable range
     *
     * @return {TimeRange} the seekable range
     */
  }, {
    key: 'seekable',
    value: function seekable() {
      var media = undefined;
      var mainSeekable = undefined;
      var audioSeekable = undefined;

      if (!this.masterPlaylistLoader_) {
        return _videoJs2['default'].createTimeRanges();
      }
      media = this.masterPlaylistLoader_.media();
      if (!media) {
        return _videoJs2['default'].createTimeRanges();
      }

      mainSeekable = Hls.Playlist.seekable(media, this.masterPlaylistLoader_.expired_);
      if (mainSeekable.length === 0) {
        return mainSeekable;
      }

      if (this.audioPlaylistLoader_) {
        audioSeekable = Hls.Playlist.seekable(this.audioPlaylistLoader_.media(), this.audioPlaylistLoader_.expired_);
        if (audioSeekable.length === 0) {
          return audioSeekable;
        }
      }

      if (!audioSeekable) {
        // seekable has been calculated based on buffering video data so it
        // can be returned directly
        return mainSeekable;
      }

      return _videoJs2['default'].createTimeRanges([[audioSeekable.start(0) > mainSeekable.start(0) ? audioSeekable.start(0) : mainSeekable.start(0), audioSeekable.end(0) < mainSeekable.end(0) ? audioSeekable.end(0) : mainSeekable.end(0)]]);
    }

    /**
     * Update the player duration
     */
  }, {
    key: 'updateDuration',
    value: function updateDuration() {
      var _this5 = this;

      var oldDuration = this.mediaSource.duration;
      var newDuration = Hls.Playlist.duration(this.masterPlaylistLoader_.media());
      var buffered = this.tech_.buffered();
      var setDuration = function setDuration() {
        _this5.mediaSource.duration = newDuration;
        _this5.tech_.trigger('durationchange');

        _this5.mediaSource.removeEventListener('sourceopen', setDuration);
      };

      if (buffered.length > 0) {
        newDuration = Math.max(newDuration, buffered.end(buffered.length - 1));
      }

      // if the duration has changed, invalidate the cached value
      if (oldDuration !== newDuration) {
        // update the duration
        if (this.mediaSource.readyState !== 'open') {
          this.mediaSource.addEventListener('sourceopen', setDuration);
        } else {
          setDuration();
        }
      }
    }

    /**
     * dispose of the MasterPlaylistController and everything
     * that it controls
     */
  }, {
    key: 'dispose',
    value: function dispose() {
      this.masterPlaylistLoader_.dispose();
      this.mainSegmentLoader_.dispose();

      this.audioSegmentLoader_.dispose();
    }

    /**
     * return the master playlist object if we have one
     *
     * @return {Object} the master playlist object that we parsed
     */
  }, {
    key: 'master',
    value: function master() {
      return this.masterPlaylistLoader_.master;
    }

    /**
     * return the currently selected playlist
     *
     * @return {Object} the currently selected playlist object that we parsed
     */
  }, {
    key: 'media',
    value: function media() {
      // playlist loader will not return media if it has not been fully loaded
      return this.masterPlaylistLoader_.media() || this.initialMedia_;
    }

    /**
     * setup our internal source buffers on our segment Loaders
     *
     * @private
     */
  }, {
    key: 'setupSourceBuffers_',
    value: function setupSourceBuffers_() {
      var media = this.masterPlaylistLoader_.media();
      var mimeTypes = undefined;

      // wait until a media playlist is available and the Media Source is
      // attached
      if (!media || this.mediaSource.readyState !== 'open') {
        return;
      }

      mimeTypes = mimeTypesForPlaylist_(this.masterPlaylistLoader_.master, media);
      if (mimeTypes.length < 1) {
        this.error = 'No compatible SourceBuffer configuration for the variant stream:' + media.resolvedUri;
        return this.mediaSource.endOfStream('decode');
      }
      this.mainSegmentLoader_.mimeType(mimeTypes[0]);
      if (mimeTypes[1]) {
        this.audioSegmentLoader_.mimeType(mimeTypes[1]);
      }

      // exclude any incompatible variant streams from future playlist
      // selection
      this.excludeIncompatibleVariants_(media);
    }

    /**
     * Blacklist playlists that are known to be codec or
     * stream-incompatible with the SourceBuffer configuration. For
     * instance, Media Source Extensions would cause the video element to
     * stall waiting for video data if you switched from a variant with
     * video and audio to an audio-only one.
     *
     * @param {Object} media a media playlist compatible with the current
     * set of SourceBuffers. Variants in the current master playlist that
     * do not appear to have compatible codec or stream configurations
     * will be excluded from the default playlist selection algorithm
     * indefinitely.
     * @private
     */
  }, {
    key: 'excludeIncompatibleVariants_',
    value: function excludeIncompatibleVariants_(media) {
      var master = this.masterPlaylistLoader_.master;
      var codecCount = 2;
      var videoCodec = null;
      var audioProfile = null;
      var codecs = undefined;

      if (media.attributes && media.attributes.CODECS) {
        codecs = parseCodecs(media.attributes.CODECS);
        videoCodec = codecs.videoCodec;
        audioProfile = codecs.audioProfile;
        codecCount = codecs.codecCount;
      }
      master.playlists.forEach(function (variant) {
        var variantCodecs = {
          codecCount: 2,
          videoCodec: null,
          audioProfile: null
        };

        if (variant.attributes && variant.attributes.CODECS) {
          var codecString = variant.attributes.CODECS;

          variantCodecs = parseCodecs(codecString);
          if (!MediaSource.isTypeSupported('video/mp4; codecs="' + codecString + '"')) {
            variant.excludeUntil = Infinity;
          }
        }

        // if the streams differ in the presence or absence of audio or
        // video, they are incompatible
        if (variantCodecs.codecCount !== codecCount) {
          variant.excludeUntil = Infinity;
        }

        // if h.264 is specified on the current playlist, some flavor of
        // it must be specified on all compatible variants
        if (variantCodecs.videoCodec !== videoCodec) {
          variant.excludeUntil = Infinity;
        }
        // HE-AAC ("mp4a.40.5") is incompatible with all other versions of
        // AAC audio in Chrome 46. Don't mix the two.
        if (variantCodecs.audioProfile === '5' && audioProfile !== '5' || audioProfile === '5' && variantCodecs.audioProfile !== '5') {
          variant.excludeUntil = Infinity;
        }
      });
    }
  }, {
    key: 'updateAdCues_',
    value: function updateAdCues_(media) {
      var offset = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

      _adCueTags2['default'].updateAdCues(media, this.cueTagsTrack_, offset);
    }
  }]);

  return MasterPlaylistController;
})(_videoJs2['default'].EventTarget);

exports.MasterPlaylistController = MasterPlaylistController;