const {createRobot} = require('probot')
process.env.STATUS_SECRET = 'tmp-signing-secret'
process.env.STATUS_CRED = 'tmpuser:tmppass'
process.env.JENKINS_URL = 'https://user:apitoken@example.com:8080/jenkins'
const plugin = require('../../lib/extpr-plugin')
const payload = require('../fixtures/pull_request.synchronize')
const statusTokenSvc = require('../../lib/update-status-token')

describe('probot-civicrm-extpr.synchronize', () => {
  let robot
  let github

  beforeEach(() => {
    robot = createRobot()

    // Load the plugin
    plugin(robot)

    // Mock out the GitHub API
    github = {
      repos: {
        checkCollaborator: jest.fn().mockImplementation(() => Promise.resolve({
          status: 204
        })),
        // Response for getting content from '.github/ISSUE_REPLY_TEMPLATE.md'
        getContent: jest.fn().mockImplementation(() => Promise.resolve({
          data: {
            content: Buffer.from(`<?xml version="1.0"?><extension key="org.civicrm.exampleext" type="module"><file>exampleext</file><name>Example Extension</name><compatibility><ver>5.0</ver></compatibility></extension>`).toString('base64')
          }
        })),
        createStatus: jest.fn()
      }
    }

    // Mock out GitHub client
    robot.auth = () => Promise.resolve(github)
    robot.checkRepoAuthz = (owner, repo) => { return true }
    robot.jenkins = {
      build_with_params: jest.fn()
    }
  })

  test('marks the status as in-progress and fires async Jenkins job', async () => {
    await robot.receive(payload)

    expect(github.repos.checkCollaborator).toHaveBeenCalledWith({
      owner: 'exampleuser',
      repo: 'examplerepo',
      username: 'exampleuser'
    })

    expect(github.repos.getContent).toHaveBeenCalledWith({
      owner: 'exampleuser',
      repo: 'examplerepo',
      path: 'info.xml'
    })

    expect(github.repos.createStatus).toHaveBeenCalledWith({
      owner: 'exampleuser',
      repo: 'examplerepo',
      sha: '5306b30b7481cefec38ff493c155532c253ca7fd',
      context: 'CiviCRM @ Master',
      state: 'pending',
      target_url: '',
      description: 'Waiting for tests to start'
    })

    var buildCall = robot.jenkins.build_with_params.mock.calls[0]
    expect(buildCall[0]).toBe('Extension-SHA')
    expect(buildCall[1].CIVI_VER).toBe('master')
    expect(buildCall[1].GIT_URL).toBe('https://github.com/exampleuser/examplerepo.git')
    expect(buildCall[1].GIT_HEAD).toBe('5306b30b7481cefec38ff493c155532c253ca7fd')
    expect(buildCall[1].GIT_BASE).toBe('master')
    expect(buildCall[1].SOURCE).toBe('https://github.com/exampleuser/examplerepo/pull/10')
    var decoded = statusTokenSvc.verify(buildCall[1].STATUS_TOKEN)
    expect(decoded.tpl.repo).toBe('examplerepo')
    expect(decoded.tpl.owner).toBe('exampleuser')
    expect(decoded.tpl.sha).toBe('5306b30b7481cefec38ff493c155532c253ca7fd')
    expect(decoded.tpl.context).toBe('CiviCRM @ Master')
    expect(decoded.instlId).toBe(197564)
    expect(decoded.eventId).toBe('12341234-1234-4321-bbbb-30c707d805a9')
  })
})
