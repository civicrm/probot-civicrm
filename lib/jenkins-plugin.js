// const jwt = require('jsonwebtoken')
// const basicAuth = require('express-basic-auth')

/**
 * Add a service `robot.jenkins` for sending requests to Jenkins CI.
 */
module.exports = (robot) => {
  if (!process.env.JENKINS_URL) {
    throw new Error('Failed to read required environment variable: JENKINS_URL')
  }

  robot.jenkins = robot.jenkins || require('./jenkins-wrapper')(process.env.JENKINS_URL)
}
