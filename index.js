module.exports = (robot) => {
  require('./lib/jenkins-plugin')(robot)
  require('./lib/autoresponder-plugin')(robot)
  require('./lib/extpr-plugin')(robot)
}
