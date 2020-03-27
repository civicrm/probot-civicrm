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
    const pr = context.payload
    await testRepoRev(context, context.payload.repository.clone_url, pr.pull_request.base.ref, pr.pull_request.head.sha, pr.pull_request.html_url)
  })

  commands(robot, 'test', async (context, command) => {
    if (!context.payload.issue.pull_request) return

    const response = await context.github.pullRequests.get(context.issue())
    const pr = response.data
    await testRepoRev(context, pr.base.repo.clone_url, pr.base.ref, pr.head.sha, pr.html_url)
  })

  // ------------------------------------------------------------------------------

  /**
   * Trigger all tests of a particular in a particular repo.
   *
   * @param context Object
   * @param gitUrl string
   * @param gitBaseRev string
   *   The latest revision of the base-branch.
   * @param gitHeadRev string
   *   The latest revision submitted by the PR author.
   */
  async function testRepoRev (context, gitUrl, gitBaseRev, gitHeadRev, sourceUrl) {
    const throttleKey = gitUrl + ' @ ' + gitBaseRev + '+' + gitHeadRev
    if (!throttle.check(throttleKey)) {
      robot.log.warn('SKIP: Tests were recently fired for ' + throttleKey)
      return
    }
    const repo = context.repo()
    const repoAuthz = await robot.checkRepoAuthz(repo.owner, repo.repo)
    if (!repoAuthz) {
      robot.log.debug('Ignore unauthorized repo: ' + repo.owner + '/' + repo.repo)
      return
    }
    if (context.payload.repository.private) {
      // We need to rework git-clone mechanics for this to be available+secure.
      robot.log.warn('Ignore request from private repo: ' + repo.owner + '/' + repo.repo)
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
        sha: gitHeadRev,
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
          'GIT_HEAD': gitHeadRev,
          'GIT_BASE': gitBaseRev,
          'SOURCE': sourceUrl,
          'STATUS_TOKEN': createStatusToken(context, statusTemplate)
        }
        await robot.jenkins.build_with_params(jobTemplate.job, jobData)
      } catch (err) {
        robot.log.error('Failed to initiate test job.', {jobTemplate: jobTemplate, jobData: jobData});
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
