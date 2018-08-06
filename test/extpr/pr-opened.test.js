const {createRobot} = require('probot')
process.env.STATUS_SECRET = 'tmp-signing-secret'
process.env.STATUS_CRED = 'tmpuser:tmppass'
process.env.JENKINS_URL = 'https://user:apitoken@example.com:8080/jenkins'
const plugin = require('../../lib/extpr-plugin')
const payload = require('../fixtures/pull_request.opened')
const statusTokenSvc = require('../../lib/update-status-token')

describe('probot-civicrm-extpr', () => {
  let robot
  let github

  beforeEach(() => {
    robot = createRobot()

    // Load the plugin
    plugin(robot)

    // Mock out the GitHub API
    github = {
      repos: {
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
    robot.jenkins = {
      build_with_params: jest.fn()
    }
  })

  test('marks the status as in-progress and fires async Jenkins job', async () => {
    await robot.receive(payload)

    expect(github.repos.getContent).toHaveBeenCalledWith({
      owner: 'exampleuser',
      repo: 'examplerepo',
      path: 'info.xml'
    })

    expect(github.repos.createStatus).toHaveBeenCalledWith({
      owner: 'exampleuser',
      repo: 'examplerepo',
      sha: '74874d028346037875657ab0aeeaab222fabcfc7',
      context: 'CiviCRM Extension',
      state: 'pending',
      target_url: '',
      description: 'Waiting for the tests to complete'
    })

    var buildCall = robot.jenkins.build_with_params.mock.calls[0]
    expect(buildCall[0]).toBe('Extension-PR')
    expect(buildCall[1].CIVI_VER).toBe('master')
    expect(buildCall[1].PR_URL).toBe('https://github.com/exampleuser/examplerepo/pull/6')
    var decoded = statusTokenSvc.verify(buildCall[1].STATUS_TOKEN)
    expect(decoded.tpl.repo).toBe('examplerepo')
    expect(decoded.tpl.owner).toBe('exampleuser')
    expect(decoded.tpl.sha).toBe('74874d028346037875657ab0aeeaab222fabcfc7')
    expect(decoded.tpl.context).toBe('CiviCRM Extension')
    expect(decoded.instlId).toBe(197564)
    expect(decoded.eventId).toBe('12341234-1234-4321-aaaa-30c707d805a9')
  })
})
