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
  if (!process.env.STATUS_SHARED) {
    throw new Error('Failed to read required environment variable: STATUS_SHARED')
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
      description: 'Waiting for the tests to complete'
    })

    try {
      await robot.jenkins.build_with_params('Extension-PR', {
        'PR_URL': context.payload.pull_request.html_url,
        'CIVI_VER': 'master'
      })
    } catch (err) {
      await context.github.repos.createStatus({
        ...statusTemplate,
        state: 'error',
        description: 'Failed to initiate test job. Please consult infrastructure support channel.'
      })
    }

    // TODO Move to update-status callback
    await context.github.repos.createStatus({
      ...statusTemplate,
      state: 'success',
      description: 'Fin'
    })
  })

  router.use(require('express').static('public'))

  // Add a new route
  router.get('/update-status', async (req, res) => {
    console.log({'STATUS_SECRET': process.env.STATUS_SECRET})
    console.log(req.query)
    res.end('Accepted status update')
    /*
    const log = robot.log.child({name: 'event', id: req.query.eventId})
    const github = await robot.auth(req.query.installId, log)

    /*
    const statusTemplate = {
      owner: 'totten',
      repo: 'githubtest',
      sha: '74874d028346037875657ab0aeeaab222fabcfc7',
      context: 'carrot'
    }
    /*
    await github.repos.createStatus({
      ...statusTemplate,
      state: 'success',
      description: 'It all worked out in the end.'
    });
    */
  })
}
