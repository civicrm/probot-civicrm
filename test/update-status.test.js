const {createRobot} = require('probot')
process.env.STATUS_SECRET = 'tmp-signing-secret'
process.env.STATUS_CRED = 'tmpuser:tmppass'
process.env.JENKINS_URL = 'https://user:apitoken@example.com:8080/jenkins'
const plugin = require('../lib/extpr-plugin')
const httpMocks = require('node-mocks-http')
const statusTokenSvc = require('../lib/update-status-token')

describe('probot-civicrm-status', () => {
  let robot
  let github

  beforeEach(() => {
    robot = createRobot()

    // Load the plugin
    plugin(robot)

    // Mock out the GitHub API
    github = {
      repos: {
        createStatus: jest.fn()
      }
    }

    // Mock out GitHub client
    robot.auth = () => Promise.resolve(github)
    robot.jenkins = {}
  })

  test('accepts a valid token and updates the status', async () => {
    const mockRequest = httpMocks.createRequest({
      method: 'POST',
      url: '/update-status',
      query: {
        state: 'success',
        description: 'Fin',
        target_url: 'http://example.com/mybuild-1234',
        statusToken: statusTokenSvc.sign({
          eventId: '1234', // context.id
          instlId: '5678', // context.payload.installation.id
          tpl: {
            owner: 'exampleuser', // context.repo().owner
            repo: 'examplerepo', // context.repo().repo
            sha: '74874d028346037875657ab0aeeaab222fabcfc7', // context.payload.pull_request.head.sha
            context: 'CiviCRM Extension'
          }
        })
      }
    })
    const mockResponse = httpMocks.createResponse()

    await require('../lib/update-status-handler')(robot)(mockRequest, mockResponse)
    expect(mockResponse._getData()).toBe('Accepted status update')

    expect(github.repos.createStatus.mock.calls.length).toBe(1)
    expect(github.repos.createStatus).toHaveBeenCalledWith({
      owner: 'exampleuser',
      repo: 'examplerepo',
      sha: '74874d028346037875657ab0aeeaab222fabcfc7',
      context: 'CiviCRM Extension',
      state: 'success',
      target_url: 'http://example.com/mybuild-1234',
      description: 'Fin'
    })
  })

  test('rejects an invalid token', async () => {
    const mockRequest = httpMocks.createRequest({
      method: 'POST',
      url: '/update-status',
      query: {
        state: 'success',
        description: 'Fin',
        statusToken: 'Zzzz'
      }
    })
    const mockResponse = httpMocks.createResponse()

    await require('../lib/update-status-handler')(robot)(mockRequest, mockResponse)
    expect(mockResponse._getData()).toBe('Failed to decode statusToken')

    expect(github.repos.createStatus.mock.calls.length).toBe(0)
  })
})
