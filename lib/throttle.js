/**
 * Track recently launched items to prevent dupes.
 *
 * @param throttleMs int
 *   If an item is checked more than once within the throttleMs interval, then
 *   it will skipped on the second (third, etc) invocations.
 * @returns {*}
 *   String or null
 */
module.exports = function (throttleMs) {
  var lastRuns = {}

  // NOTE: These functions should be atomic - no async I/O.

  return {
    /**
     * Delete info about old items.
     * @returns {exports}
     */
    prune: function () {
      var cutoff = Date.now() - throttleMs
      var newLastRuns = {}
      for (var i in lastRuns) {
        if (lastRuns[i] >= cutoff) {
          newLastRuns[i] = lastRuns[i]
        }
      }
      lastRuns = newLastRuns
    },

    allow: function (name) {
      return lastRuns[name] === undefined || (lastRuns[name] <= (Date.now() - throttleMs))
    },

    /**
     * Attempt to use an item (but only if it hasn't been used recently).
     *
     * @param name string
     * @returns {boolean}
     *   True if we should proceed with the throttled task.
     *   False if we should skip the throttled task.
     */
    check: function (name) {
      this.prune()
      if (this.allow(name)) {
        lastRuns[name] = Date.now()
        return true
      }
      return false
    }
  }
}
