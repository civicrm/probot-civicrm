module.exports = (context) => {
  const payload = context.payload
  var tplVars = {ci: {}}

  const prefixes = {
    'exampleuser/examplerepo': 'ex',
    'civicrm/civicrm-backdrop': 'bd',
    'civicrm/civicrm-core': 'core',
    'civicrm/civicrm-packages': 'pkg',
    'civicrm/civicrm-drupal': 'd7',
    'civicrm/civicrm-drupal-8': 'd8',
    'civicrm/org.civicrm.flexmailer': 'flxm',
    'totten/githubtest': 'ght'
  }

  tplVars.ci.test_host = 'site-list.test-1.civicrm.org'

  tplVars.ci.browse_test_url = function () {
    const repo = payload.repository.full_name
    const prefix = prefixes[repo] ? prefixes[repo] : null
    if (!prefix) {
      return 'http://UNKNOWN-REPO'
    }

    return 'http://' + tplVars.ci.test_host +
      '/?filter=' + prefix + '-' + payload.pull_request.number + '-*'
  }

  return tplVars
}
