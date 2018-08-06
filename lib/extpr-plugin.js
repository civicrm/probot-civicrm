const statusTokenSvc = require('./update-status-token')

/**
 * The extpr plugin detects CiviCRM extensions. If the repository is suitably authorized,
 * it triggers a test job in Jenkins.
 */
module.exports = (robot) => {
  const getFileContent = require('./get-content')

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

    const repo = context.repo()
    const statusTemplate = {
      ...repo,
      sha: context.payload.pull_request.head.sha,
      context: 'CiviCRM @ Master'
    }

    await context.github.repos.createStatus({
      ...statusTemplate,
      state: 'pending',
      target_url: '',
      description: 'Waiting for tests to start'
    })

    try {
      var jobData = {
        'GIT_URL': context.payload.repository.git_url,
        'GIT_COMMIT': context.payload.pull_request.head.sha,
        'CIVI_VER': 'master',
        'STATUS_TOKEN': createStatusToken(context, statusTemplate)
      }
      await robot.jenkins.build_with_params('Extension-SHA', jobData)
    } catch (err) {
      await context.github.repos.createStatus({
        ...statusTemplate,
        state: 'error',
        target_url: '',
        description: 'Failed to initiate test job. Please consult infrastructure support channel.'
      })
    }
  })

  /**
   * Create a callback token that can be used to update the status
   * of a particular check/job.
   *
   * @param Object context
   *   The webhook context of the pull-request which we're testing.
   * @param Object tpl
   *   Template/mandatory parameters for a call github.repos.createStatus().
   * @returns {*}
   *   Signed token
   */
  function createStatusToken (context, tpl) {
    return statusTokenSvc.sign({
      eventId: context.id,
      instlId: context.payload.installation.id,
      tpl: tpl
    })
  }
}
