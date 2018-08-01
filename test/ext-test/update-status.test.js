const {createRobot} = require('probot')
process.env.STATUS_SECRET = 'tmp-signing-secret'
process.env.STATUS_SHARED = 'tmp-auth-token'
process.env.JENKINS_URL = 'https://user:apitoken@example.com:8080/jenkins'
const plugin = require('../../lib/ext-test-plugin')
const httpMocks = require('node-mocks-http')
var jwt = require('jsonwebtoken')

describe('probot-civicrm-ext-test', () => {
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
    const mockRequest = httpMocks.createRequest({
      method: 'POST',
      url: '/update-status',
      query: {
        state: 'success',
        description: 'Fin',
        statusToken: jwt.sign({
          data: {
            id: '1234', // context.id
            insid: '5678', // context.payload.installation.id
            tpl: {
              owner: 'exampleuser', // context.repo().owner
              repo: 'examplerepo', // context.repo().repo
              sha: '74874d028346037875657ab0aeeaab222fabcfc7', // context.payload.pull_request.head.sha
              context: 'CiviCRM Extension'
            }
          }
        }, process.env.STATUS_SECRET, { expiresIn: '1d', algorithm: 'HS256' })
      }
    })
    const mockResponse = httpMocks.createResponse()

    await require('../../lib/update-status-handler')(robot)(mockRequest, mockResponse)
    expect(mockResponse._getData()).toBe('Accepted status update')

    expect(github.repos.createStatus).toHaveBeenCalledWith({
      owner: 'exampleuser',
      repo: 'examplerepo',
      sha: '74874d028346037875657ab0aeeaab222fabcfc7',
      context: 'CiviCRM Extension',
      state: 'success',
      description: 'Fin'
    })
  })
})
