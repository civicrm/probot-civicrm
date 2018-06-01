module.exports = (robot) => {
  var Mustache = require('mustache')
  var vars = require('./variables')(robot)
  var templates = require('./templates')(robot)

  robot.on('pull_request.opened', async context => {
    const template = await templates.find(context, 'PR_REPLY_TEMPLATE')
    if (template === null || template === '') return
    const body = Mustache.render(template, vars.generate(context))
    return context.github.issues.createComment(context.issue({body: body}))
  })

  robot.on('issues.opened', async context => {
    const template = await templates.find(context, 'ISSUE_REPLY_TEMPLATE')
    if (template === null || template === '') return
    const body = Mustache.render(template, vars.generate(context))
    return context.github.issues.createComment(context.issue({body: body}))
  })
}
