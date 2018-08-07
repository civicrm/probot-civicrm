const statusTokenSvc = require('./update-status-token')
const commands = require('probot-commands')

/**
 * The extpr plugin detects CiviCRM extensions. If the repository is suitably authorized,
 * it triggers a test job in Jenkins.
 */
module.exports = (robot) => {
  const getFileContent = require('./get-content')
  const throttle = require('./throttle')(5000)

  if (!process.env.STATUS_SECRET) {
    throw new Error('Failed to read required environment variable: STATUS_SECRET')
  }

  /**
   * When we receive notice that some code needs to be tested, we trigger all of
   * these Jenkins jobs -- and display a distinct status for each.
   *
   * @type {*[]}
   */
  const jobTemplates = [
    // {name: 'CiviCRM @ RC', job: 'Extension-SHA', jobData: {'CIVI_VER': '5.4'}},
    // {name: 'CiviCRM @ Stable', job: 'Extension-SHA', jobData: {'CIVI_VER': '5.3'}},
    {name: 'CiviCRM @ Master', job: 'Extension-SHA', jobData: {'CIVI_VER': 'master'}}
  ]

  robot.on(['pull_request.opened', 'pull_request.reopened', 'pull_request.synchronize'], async (context) => {
    await testRepoRev(context, context.payload.repository.clone_url, context.payload.pull_request.head.sha)
  })

  commands(robot, 'civici', async (context, command) => {
    if (command.arguments !== 'test') return
    if (!context.payload.issue.pull_request) return

    var pr = await context.github.pullRequests.get(context.issue())
    await testRepoRev(context, pr.data.base.repo.clone_url, pr.data.head.sha)
  })

  // ------------------------------------------------------------------------------

  /**
   * Trigger all tests of a particular in a particular repo.
   *
   * @param context Object
   * @param gitUrl string
   * @param gitRev string
   */
  async function testRepoRev (context, gitUrl, gitRev) {
    if (!throttle.check(gitUrl + ' @ ' + gitRev)) {
      robot.log.warn('SKIP: Tests were recently fired for ' + gitUrl + ' @ ' + gitRev)
      return
    }
    const repo = context.repo()
    const repoAuthz = await robot.checkRepoAuthz(repo.owner, repo.repo)
    if (!repoAuthz) {
      robot.log.debug('Ignore unauthorized repo: ' + repo.owner + '/' + repo.repo)
      return
    }

    const activeUsername = context.payload.sender.login
    const userAuthz = await context.github.repos.checkCollaborator({
      ...repo,
      username: activeUsername
    })
    if (userAuthz.status < 200 || userAuthz.status >= 300) {
      robot.log.warn('Ignore request from unauthorized user: ' + activeUsername)
      return false
    }

    const infoxml = await getFileContent(context, 'info.xml')
    if (infoxml === null || infoxml === '') {
      return
    }

    for (var jobTplId in jobTemplates) {
      const jobTemplate = jobTemplates[jobTplId]
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
