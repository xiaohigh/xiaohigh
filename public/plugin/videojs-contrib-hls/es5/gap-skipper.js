/**
 * @file gap-skipper.js
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _ranges = require('./ranges');

var _ranges2 = _interopRequireDefault(_ranges);

var _videoJs = require('video.js');

var _videoJs2 = _interopRequireDefault(_videoJs);

// Set of events that reset the gap-skipper logic and clear the timeout
var timerCancelEvents = ['seeking', 'seeked', 'pause', 'playing', 'error'];

/**
 * The gap skipper object handles all scenarios
 * where the player runs into the end of a buffered
 * region and there is a buffered region ahead.
 *
 * It then handles the skipping behavior by setting a
 * timer to the size (in time) of the gap. This gives
 * the hls segment fetcher time to close the gap and
 * resume playing before the timer is triggered and
 * the gap skipper simply seeks over the gap as a
 * last resort to resume playback.
 *
 * @class GapSkipper
 */

var GapSkipper = (function () {
  /**
   * Represents a GapSKipper object.
   * @constructor
   * @param {object} options an object that includes the tech and settings
   */

  function GapSkipper(options) {
    var _this = this;

    _classCallCheck(this, GapSkipper);

    this.tech_ = options.tech;
    this.consecutiveUpdates = 0;
    this.lastRecordedTime = null;
    this.timer_ = null;

    if (options.debug) {
      this.logger_ = _videoJs2['default'].log.bind(_videoJs2['default'], 'gap-skipper ->');
    }
    this.logger_('initialize');

    var waitingHandler = function waitingHandler() {
      return _this.waiting_();
    };
    var timeupdateHandler = function timeupdateHandler() {
      return _this.timeupdate_();
    };
    var cancelTimerHandler = function cancelTimerHandler() {
      return _this.cancelTimer_();
    };

    this.tech_.on('waiting', waitingHandler);
    this.tech_.on('timeupdate', timeupdateHandler);
    this.tech_.on(timerCancelEvents, cancelTimerHandler);

    // Define the dispose function to clean up our events
    this.dispose = function () {
      _this.logger_('dispose');
      _this.tech_.off('waiting', waitingHandler);
      _this.tech_.off('timeupdate', timeupdateHandler);
      _this.tech_.off(timerCancelEvents, cancelTimerHandler);
      _this.cancelTimer_();
    };
  }

  /**
   * Handler for `waiting` events from the player
   *
   * @private
   */

  _createClass(GapSkipper, [{
    key: 'waiting_',
    value: function waiting_() {
      if (!this.tech_.seeking()) {
        this.setTimer_();
      }
    }

    /**
     * The purpose of this function is to emulate the "waiting" event on
     * browsers that do not emit it when they are waiting for more
     * data to continue playback
     *
     * @private
     */
  }, {
    key: 'timeupdate_',
    value: function timeupdate_() {
      if (this.tech_.paused() || this.tech_.seeking()) {
        return;
      }

      var currentTime = this.tech_.currentTime();

      if (this.consecutiveUpdates === 5 && currentTime === this.lastRecordedTime) {
        this.consecutiveUpdates++;
        this.waiting_();
      } else if (currentTime === this.lastRecordedTime) {
        this.consecutiveUpdates++;
      } else {
        this.consecutiveUpdates = 0;
        this.lastRecordedTime = currentTime;
      }
    }

    /**
     * Cancels any pending timers and resets the 'timeupdate' mechanism
     * designed to detect that we are stalled
     *
     * @private
     */
  }, {
    key: 'cancelTimer_',
    value: function cancelTimer_() {
      this.consecutiveUpdates = 0;

      if (this.timer_) {
        this.logger_('cancelTimer_');
        clearTimeout(this.timer_);
      }

      this.timer_ = null;
    }

    /**
     * Timer callback. If playback still has not proceeded, then we seek
     * to the start of the next buffered region.
     *
     * @private
     */
  }, {
    key: 'skipTheGap_',
    value: function skipTheGap_(scheduledCurrentTime) {
      var buffered = this.tech_.buffered();
      var currentTime = this.tech_.currentTime();
      var nextRange = _ranges2['default'].findNextRange(buffered, currentTime);

      this.consecutiveUpdates = 0;
      this.timer_ = null;

      if (nextRange.length === 0 || currentTime !== scheduledCurrentTime) {
        return;
      }

      this.logger_('skipTheGap_:', 'currentTime:', currentTime, 'scheduled currentTime:', scheduledCurrentTime, 'nextRange start:', nextRange.start(0));

      // only seek if we still have not played
      this.tech_.setCurrentTime(nextRange.start(0) + _ranges2['default'].TIME_FUDGE_FACTOR);
    }
  }, {
    key: 'gapFromVideoUnderflow_',
    value: function gapFromVideoUnderflow_(buffered, currentTime) {
      // At least in Chrome, if there is a gap in the video buffer, the audio will continue
      // playing for ~3 seconds after the video gap starts. This is done to account for
      // video buffer underflow/underrun (note that this is not done when there is audio
      // buffer underflow/underrun -- in that case the video will stop as soon as it
      // encounters the gap, as audio stalls are more noticeable/jarring to a user than
      // video stalls). The player's time will reflect the playthrough of audio, so the
      // time will appear as if we are in a buffered region, even if we are stuck in a
      // "gap."
      //
      // Example:
      // video buffer:   0 => 10.1, 10.2 => 20
      // audio buffer:   0 => 20
      // overall buffer: 0 => 10.1, 10.2 => 20
      // current time: 13
      //
      // Chrome's video froze at 10 seconds, where the video buffer encountered the gap,
      // however, the audio continued playing until it reached ~3 seconds past the gap
      // (13 seconds), at which point it stops as well. Since current time is past the
      // gap, findNextRange will return no ranges.
      //
      // To check for this issue, we see if there is a gap that starts somewhere within
      // a 3 second range (3 seconds +/- 1 second) back from our current time.
      var gaps = _ranges2['default'].findGaps(buffered);

      for (var i = 0; i < gaps.length; i++) {
        var start = gaps.start(i);
        var end = gaps.end(i);

        // gap is starts no more than 4 seconds back
        if (currentTime - start < 4 && currentTime - start > 2) {
          return {
            start: start,
            end: end
          };
        }
      }

      return null;
    }

    /**
     * Set a timer to skip the unbuffered region.
     *
     * @private
     */
  }, {
    key: 'setTimer_',
    value: function setTimer_() {
      var buffered = this.tech_.buffered();
      var currentTime = this.tech_.currentTime();
      var nextRange = _ranges2['default'].findNextRange(buffered, currentTime);

      if (this.timer_ !== null) {
        return;
      }

      if (nextRange.length === 0) {
        // Even if there is no available next range, there is still a possibility we are
        // stuck in a gap due to video underflow.
        var gap = this.gapFromVideoUnderflow_(buffered, currentTime);

        if (gap) {
          this.logger_('setTimer_:', 'Encountered a gap in video', 'from: ', gap.start, 'to: ', gap.end, 'seeking to current time: ', currentTime);
          // Even though the video underflowed and was stuck in a gap, the audio overplayed
          // the gap, leading currentTime into a buffered range. Seeking to currentTime
          // allows the video to catch up to the audio position without losing any audio
          // (only suffering ~3 seconds of frozen video and a pause in audio playback).
          this.tech_.setCurrentTime(currentTime);
        }
        return;
      }

      var difference = nextRange.start(0) - currentTime;

      this.logger_('setTimer_:', 'stopped at:', currentTime, 'setting timer for:', difference, 'seeking to:', nextRange.start(0));

      this.timer_ = setTimeout(this.skipTheGap_.bind(this), difference * 1000, currentTime);
    }

    /**
     * A debugging logger noop that is set to console.log only if debugging
     * is enabled globally
     *
     * @private
     */
  }, {
    key: 'logger_',
    value: function logger_() {}
  }]);

  return GapSkipper;
})();

exports['default'] = GapSkipper;
module.exports = exports['default'];