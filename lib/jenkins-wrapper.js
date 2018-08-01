/**
 * This is a wrapper for jenkinsapi in which each function returns a promise.
 *
 * const jenkins = require('jenkins-wrapper.js')('http://user:pass@host')
 * var result = await jenkins.build_with_params(...);
 */
module.exports = (url) => {
  const jenkinsapi = require('jenkins-api')
  const {promisify} = require('util')

  const funcs = ['build', 'build_with_params', 'stop_build', 'console_output', 'build_info', 'last_build_info', 'last_completed_build_info', 'all_builds', 'test_result']
  // TODO: All functions...
  const orig = jenkinsapi.init(url)
  var jp = {JENKINS: orig}
  for (const func of funcs) {
    jp[func] = promisify(orig[func]).bind(orig)
  }

  return jp
}
