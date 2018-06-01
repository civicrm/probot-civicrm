const {createRobot} = require('probot')
const plugin = require('..')
const payload = require('./fixtures/pull_request.opened')

describe('civicrm-autoresponder', () => {
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
            content: Buffer.from(`[Browse test sites for #{{pr.number}}]({{{ci.browse_url}}})`).toString('base64')
          }
        }))
      },

      issues: {
        createComment: jest.fn()
      }
    }

    // Mock out GitHub client
    robot.auth = () => Promise.resolve(github)
  })

  test('posts a comment', async () => {
    await robot.receive(payload)

    expect(github.repos.getContent).toHaveBeenCalledWith({
      owner: 'totten',
      repo: 'githubtest',
      path: '.github/PR_REPLY_TEMPLATE.md.mustache'
    })

    expect(github.issues.createComment).toHaveBeenCalledWith({
      owner: 'totten',
      repo: 'githubtest',
      number: 6,
      body: '[Browse test sites for #6](http://site-list.example.com/?filter=example-6-%2A)'
    })
  })
})
