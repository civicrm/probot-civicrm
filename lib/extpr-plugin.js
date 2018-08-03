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
        'STATUS_TOKEN': statusTokenSvc.sign(statusTokenData)
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
}
