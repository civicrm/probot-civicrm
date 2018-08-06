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

  const jobTemplates = [
    // {name: 'CiviCRM @ RC', job: 'Extension-SHA', jobData: {'CIVI_VER': '5.4'}},
    // {name: 'CiviCRM @ Stable', job: 'Extension-SHA', jobData: {'CIVI_VER': '5.3'}},
    {name: 'CiviCRM @ Master', job: 'Extension-SHA', jobData: {'CIVI_VER': 'master'}}
  ]

  robot.on(['pull_request.opened', 'pull_request.reopened', 'pull_request.synchronize'], async (context) => {
    await testRepoRev(context, context.payload.repository.git_url, context.payload.pull_request.head.sha)
  })

  /**
   * Trigger all tests of a particular in a particular repo.
   *
   * @param context Object
   * @param gitUrl string
   * @param gitRev string
   */
  async function testRepoRev (context, gitUrl, gitRev) {
    const infoxml = await getFileContent(context, 'info.xml')
    if (infoxml === null || infoxml === '') {
      return
    }

    for (var jobTplId in jobTemplates) {
      const jobTemplate = jobTemplates[jobTplId]
      const repo = context.repo()
      const statusTemplate = {
        ...repo,
        sha: gitRev,
        context: jobTemplate.name
      }

      await context.github.repos.createStatus({
        ...statusTemplate,
        state: 'pending',
        target_url: '',
        description: 'Waiting for tests to start'
      })

      try {
        var jobData = {
          ...jobTemplate.jobData,
          'GIT_URL': gitUrl,
          'GIT_COMMIT': gitRev,
          'STATUS_TOKEN': createStatusToken(context, statusTemplate)
        }
        await robot.jenkins.build_with_params(jobTemplate.job, jobData)
      } catch (err) {
        await context.github.repos.createStatus({
          ...statusTemplate,
          state: 'error',
          target_url: '',
          description: 'Failed to initiate test job. Please consult infrastructure support channel.'
        })
      }
    }
  }

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
