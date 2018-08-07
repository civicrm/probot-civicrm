describe('probot-civicrm-repo-authz', () => {
  beforeEach(() => {
  })

  test('checks owner and repo authorization', async () => {
    var robot = {}
    require('../lib/repo-authz-plugin')(robot, '../config/_COMMON_/repo-authz')
    expect(await robot.checkRepoAuthz('civicrm', 'foo')).toBe(true)
    expect(await robot.checkRepoAuthz('acivicrm', 'foo')).toBe(false)
    expect(await robot.checkRepoAuthz('civicrma', 'foo')).toBe(false)
  })
})
