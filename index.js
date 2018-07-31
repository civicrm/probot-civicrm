module.exports = (robot) => {
  require('./lib/autoresponder-plugin')(robot)
  require('./lib/ext-test-plugin')(robot)
}
