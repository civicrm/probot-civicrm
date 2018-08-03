const jwt = require('jsonwebtoken')
const basicAuth = require('express-basic-auth')

/**
 * The ext-test plugin detects CiviCRM extensions. If the repository is suitably authorized,
 * it triggers a test job in Jenkins.
 */
module.exports = (robot) => {
  const getFileContent = require('./get-content')
  const router = robot.route('/probot-civicrm-ext-test')

  if (!process.env.STATUS_SECRET) {
    throw new Error('Failed to read required environment variable: STATUS_SECRET')
  }
  if (!process.env.STATUS_CRED) {
    robot.log.warn('No value supplied for STATUS_CRED. To enable authentication in the update-status endpoint, please set it.');
  }
  if (!process.env.JENKINS_URL) {
    throw new Error('Failed to read required environment variable: JENKINS_URL')
  }

  robot.jenkins = robot.jenkins || require('./jenkins-wrapper')(process.env.JENKINS_URL)

  /**
   * When the PR is opened or updated, mark the commit as pending and notify Jenkins.
   */
  robot.on('pull_request.opened', async context => {
    const infoxml = await getFileContent(context, 'info.xml')
    if (infoxml === null || infoxml === '') {
      return
    }

    const { sha } = context.payload.pull_request.head
    const repo = context.repo()
    const statusTemplate = { ...repo, sha, context: 'CiviCRM Extension' }

    await context.github.repos.createStatus({
      ...statusTemplate,
      state: 'pending',
      target_url: '',
      description: 'Waiting for the tests to complete'
    })

    try {
      const statusTokenData = {
        eventId: context.id,
        instlId: context.payload.installation.id,
        tpl: {
          owner: context.repo().owner,
          repo: context.repo().repo,
          sha: context.payload.pull_request.head.sha,
          context: 'CiviCRM Extension'
        }
      }

      await robot.jenkins.build_with_params('Extension-PR', {
        'PR_URL': context.payload.pull_request.html_url,
        'CIVI_VER': 'master',
        'STATUS_TOKEN': jwt.sign({data: statusTokenData}, process.env.STATUS_SECRET, { expiresIn: '1d', algorithm: 'HS256' })
      })
    } catch (err) {
      await context.github.repos.createStatus({
        ...statusTemplate,
        state: 'error',
        target_url: '',
        description: 'Failed to initiate test job. Please consult infrastructure support channel.'
      })
    }
  })

  if (process.env.STATUS_CRED) {
    var parts = process.env.STATUS_CRED.split(':')
    var users = {}
    users[parts[0]] = parts[1]
    robot.log.error('users are', users)
    router.use('/update-status', basicAuth({
      realm: 'ext-test',
      users: users
    }))
  } else {
    router.use(require('express').static('public'))
  }

  router.all('/update-status', require('./update-status-handler')(robot))
}
