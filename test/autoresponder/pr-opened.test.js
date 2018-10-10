const {createRobot} = require('probot')
const plugin = require('../../lib/autoresponder-plugin')
const payload = require('../fixtures/pull_request.opened')

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
            content: Buffer.from(`[Browse test sites for #{{pull_request.number}} on {{ci.test_host}}]({{{ci.browse_test_url}}}/). {{ci.foobar}}`).toString('base64')
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

  test('posts a comment on a new PR using repo template', async () => {
    await robot.receive(payload)

    expect(github.repos.getContent).toHaveBeenCalledWith({
      owner: 'exampleuser',
      repo: 'examplerepo',
      path: '.github/PR_REPLY_TEMPLATE.mustache.md'
    })

    expect(github.issues.createComment).toHaveBeenCalledWith({
      owner: 'exampleuser',
      repo: 'examplerepo',
      number: 6,
      body: '[Browse test sites for #6 on site-list.test-1.civicrm.org](http://site-list.test-1.civicrm.org/?filter=ex-6-*/). whimsy'
    })
  })
})
