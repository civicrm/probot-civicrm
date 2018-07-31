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

    // TODO notify Jenkins
  })

  router.use(require('express').static('public'))

  // Add a new route
  router.get('/hello-world', async (req, res) => {
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
