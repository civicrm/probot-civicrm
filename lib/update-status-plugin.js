// const jwt = require('jsonwebtoken')
const basicAuth = require('express-basic-auth')

/**
 * Add the HTTP route `/probot-civicrm-status/update-status` for relaying status updates.
 */
module.exports = (robot) => {
  const router = robot.route('/probot-civicrm-status')

  if (!process.env.STATUS_SECRET) {
    throw new Error('Failed to read required environment variable: STATUS_SECRET')
  }
  if (!process.env.STATUS_CRED) {
    robot.log.warn('No value supplied for STATUS_CRED. To enable authentication in the update-status endpoint, please set it.')
  }

  if (process.env.STATUS_CRED) {
    var parts = process.env.STATUS_CRED.split(':')
    var users = {}
    users[parts[0]] = parts[1]
    router.use('/update', basicAuth({
      realm: 'probot-civicrm-status',
      users: users
    }))
  } else {
    router.use(require('express').static('public'))
  }

  router.all('/update', require('./update-status-handler')(robot))
}
