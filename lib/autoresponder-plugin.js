/**
 * The autoresponder monitors for new PRs and new issues. It looks for a
 * Mustache-encoded template named ISSUE_REPLY_TEMPLATE or PR_REPLY_TEMPLATE;
 * if found, it posts comment.
 */
module.exports = (robot) => {
  var path = require('path')
  var Mustache = require('mustache')
  var vars = require('./variables')(robot, path.join(path.dirname(__dirname), 'config'))
  var templates = require('./templates')(robot, path.join(path.dirname(__dirname), 'config'))

  robot.on('pull_request.opened', async context => {
    const repo = context.repo()
    const repoAuthz = await robot.checkRepoAuthz(repo.owner, repo.repo)
    if (!repoAuthz) {
      robot.log.debug('Ignore unauthorized repo: ' + repo.owner + '/' + repo.repo)
      return
    }

    const template = await templates.find(context, 'PR_REPLY_TEMPLATE')
    if (template === null || template === '') return
    const body = Mustache.render(template, vars.generate(context))
    return context.github.issues.createComment(context.issue({body: body}))
  })

  robot.on('issues.opened', async context => {
    const repo = context.repo()
    const repoAuthz = await robot.checkRepoAuthz(repo.owner, repo.repo)
    if (!repoAuthz) {
      robot.log.debug('Ignore unauthorized repo: ' + repo.owner + '/' + repo.repo)
      return
    }

    const template = await templates.find(context, 'ISSUE_REPLY_TEMPLATE')
    if (template === null || template === '') return
    const body = Mustache.render(template, vars.generate(context))
    return context.github.issues.createComment(context.issue({body: body}))
  })
}
