module.exports = (context) => {
  const payload = context.payload
  var ci = {
    test_host: 'site-list.test-ubu1204-5.civicrm.org',
    repo_prefix: function () {
      const repo = payload.repository.full_name
      const map = {
        'exampleuser/examplerepo': 'ex',
        'civicrm/civicrm-backdrop': 'bd',
        'civicrm/civicrm-core': 'core',
        'civicrm/civicrm-packages': 'pkg',
        'civicrm/civicrm-drupal': 'd7',
        'civicrm/civicrm-drupal-8': 'd8',
        'civicrm/org.civicrm.flexmailer': 'flxm',
        'totten/githubtest': 'ght'
      }
      return map[repo] ? map[repo] : null
    },
    browse_test_url: function () {
      const prefix = ci.repo_prefix()
      if (!prefix) {
        return 'http://UNKNOWN-REPO'
      }
      return 'http://' + ci.test_host +
        '/?filter=' + ci.repo_prefix() + '-' + payload.pull_request.number + '-*'
    }
  }

  return {ci: ci}
}
