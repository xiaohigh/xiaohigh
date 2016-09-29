/**
 * @file source-updater.js
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _videoJs = require('video.js');

var _videoJs2 = _interopRequireDefault(_videoJs);

/**
 * A queue of callbacks to be serialized and applied when a
 * MediaSource and its associated SourceBuffers are not in the
 * updating state. It is used by the segment loader to update the
 * underlying SourceBuffers when new data is loaded, for instance.
 *
 * @class SourceUpdater
 * @param {MediaSource} mediaSource the MediaSource to create the
 * SourceBuffer from
 * @param {String} mimeType the desired MIME type of the underlying
 * SourceBuffer
 */

var SourceUpdater = (function () {
  function SourceUpdater(mediaSource, mimeType) {
    var _this = this;

    _classCallCheck(this, SourceUpdater);

    var createSourceBuffer = function createSourceBuffer() {
      _this.sourceBuffer_ = mediaSource.addSourceBuffer(mimeType);

      // run completion handlers and process callbacks as updateend
      // events fire
      _this.onUpdateendCallback_ = function () {
        var pendingCallback = _this.pendingCallback_;

        _this.pendingCallback_ = null;

        if (pendingCallback) {
          pendingCallback();
        }

        _this.runCallback_();
      };

      _this.sourceBuffer_.addEventListener('updateend', _this.onUpdateendCallback_);

      _this.runCallback_();
    };

    this.callbacks_ = [];
    this.pendingCallback_ = null;
    this.timestampOffset_ = 0;
    this.mediaSource = mediaSource;

    if (mediaSource.readyState === 'closed') {
      mediaSource.addEventListener('sourceopen', createSourceBuffer);
    } else {
      createSourceBuffer();
    }
  }

  /**
   * Aborts the current segment and resets the segment parser.
   *
   * @param {Function} done function to call when done
   * @see http://w3c.github.io/media-source/#widl-SourceBuffer-abort-void
   */

  _createClass(SourceUpdater, [{
    key: 'abort',
    value: function abort(done) {
      var _this2 = this;

      this.queueCallback_(function () {
        _this2.sourceBuffer_.abort();
      }, done);
    }

    /**
     * Queue an update to append an ArrayBuffer.
     *
     * @param {ArrayBuffer} bytes
     * @param {Function} done the function to call when done
     * @see http://www.w3.org/TR/media-source/#widl-SourceBuffer-appendBuffer-void-ArrayBuffer-data
     */
  }, {
    key: 'appendBuffer',
    value: function appendBuffer(bytes, done) {
      var _this3 = this;

      this.queueCallback_(function () {
        _this3.sourceBuffer_.appendBuffer(bytes);
      }, done);
    }

    /**
     * Indicates what TimeRanges are buffered in the managed SourceBuffer.
     *
     * @see http://www.w3.org/TR/media-source/#widl-SourceBuffer-buffered
     */
  }, {
    key: 'buffered',
    value: function buffered() {
      if (!this.sourceBuffer_) {
        return _videoJs2['default'].createTimeRanges();
      }
      return this.sourceBuffer_.buffered;
    }

    /**
     * Queue an update to set the duration.
     *
     * @param {Double} duration what to set the duration to
     * @see http://www.w3.org/TR/media-source/#widl-MediaSource-duration
     */
  }, {
    key: 'duration',
    value: function duration(_duration) {
      var _this4 = this;

      this.queueCallback_(function () {
        _this4.sourceBuffer_.duration = _duration;
      });
    }

    /**
     * Queue an update to remove a time range from the buffer.
     *
     * @param {Number} start where to start the removal
     * @param {Number} end where to end the removal
     * @see http://www.w3.org/TR/media-source/#widl-SourceBuffer-remove-void-double-start-unrestricted-double-end
     */
  }, {
    key: 'remove',
    value: function remove(start, end) {
      var _this5 = this;

      this.queueCallback_(function () {
        _this5.sourceBuffer_.remove(start, end);
      });
    }

    /**
     * wether the underlying sourceBuffer is updating or not
     *
     * @return {Boolean} the updating status of the SourceBuffer
     */
  }, {
    key: 'updating',
    value: function updating() {
      return !this.sourceBuffer_ || this.sourceBuffer_.updating;
    }

    /**
     * Set/get the timestampoffset on the SourceBuffer
     *
     * @return {Number} the timestamp offset
     */
  }, {
    key: 'timestampOffset',
    value: function timestampOffset(offset) {
      var _this6 = this;

      if (typeof offset !== 'undefined') {
        this.queueCallback_(function () {
          _this6.sourceBuffer_.timestampOffset = offset;
        });
        this.timestampOffset_ = offset;
      }
      return this.timestampOffset_;
    }

    /**
     * que a callback to run
     */
  }, {
    key: 'queueCallback_',
    value: function queueCallback_(callback, done) {
      this.callbacks_.push([callback.bind(this), done]);
      this.runCallback_();
    }

    /**
     * run a queued callback
     */
  }, {
    key: 'runCallback_',
    value: function runCallback_() {
      var callbacks = undefined;

      if (this.sourceBuffer_ && !this.sourceBuffer_.updating && this.callbacks_.length) {
        callbacks = this.callbacks_.shift();
        this.pendingCallback_ = callbacks[1];
        callbacks[0]();
      }
    }

    /**
     * dispose of the source updater and the underlying sourceBuffer
     */
  }, {
    key: 'dispose',
    value: function dispose() {
      this.sourceBuffer_.removeEventListener('updateend', this.onUpdateendCallback_);
      if (this.sourceBuffer_ && this.mediaSource.readyState === 'open') {
        this.sourceBuffer_.abort();
      }
    }
  }]);

  return SourceUpdater;
})();

exports['default'] = SourceUpdater;
module.exports = exports['default'];