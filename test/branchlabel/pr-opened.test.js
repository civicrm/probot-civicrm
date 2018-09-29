const {createRobot} = require('probot')
const plugin = require('../../lib/branchlabel-plugin')
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
      issues: {
        getLabel: jest.fn(),
        addLabels: jest.fn()
      }
    }

    // Mock out GitHub client
    robot.auth = () => Promise.resolve(github)
    robot.checkRepoAuthz = (owner, repo) => { return owner === 'exampleuser' }
  })

  test('adds a label on a new PR', async () => {
    await robot.receive(payload)

    expect(github.issues.getLabel).toHaveBeenCalledWith({
      owner: 'exampleuser',
      repo: 'examplerepo',
      name: 'master'
    })

    expect(github.issues.addLabels).toHaveBeenCalledWith({
      owner: 'exampleuser',
      repo: 'examplerepo',
      number: 6,
      labels: ['master']
    })
  })
})
