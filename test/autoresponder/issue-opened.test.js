const {createRobot} = require('probot')
const plugin = require('../../lib/autoresponder-plugin')
const payload = require('../fixtures/issue.opened')

describe('probot-civicrm-autoresponder', () => {
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
            content: Buffer.from(`This is issue #{{issue.number}}. {{ci.foobar}}`).toString('base64')
          }
        }))
      },

      issues: {
        createComment: jest.fn()
      }
    }

    // Mock out GitHub client
    robot.auth = () => Promise.resolve(github)
    robot.checkRepoAuthz = (owner, repo) => { return owner === 'exampleuser' }
  })

  test('posts a comment on a new issue', async () => {
    await robot.receive(payload)

    expect(github.repos.getContent).toHaveBeenCalledWith({
      owner: 'exampleuser',
      repo: 'examplerepo',
      path: '.github/ISSUE_REPLY_TEMPLATE.mustache.md'
    })

    expect(github.issues.createComment).toHaveBeenCalledWith({
      owner: 'exampleuser',
      repo: 'examplerepo',
      number: 7,
      body: 'This is issue #7. whimsy'
    })
  })
})
