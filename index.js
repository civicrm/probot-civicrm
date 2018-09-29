module.exports = (robot) => {
  const path = require('path')

  require('./lib/jenkins-plugin')(robot)
  require('./lib/autoresponder-plugin')(robot)
  require('./lib/branchlabel-plugin')(robot)
  require('./lib/extpr-plugin')(robot)
  require('./lib/update-status-plugin')(robot)
  require('./lib/repo-authz-plugin')(robot, path.join(__dirname, 'config', '_COMMON_', 'repo-authz'))
}
