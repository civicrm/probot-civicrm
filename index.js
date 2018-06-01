module.exports = (robot) => {
  var fs = require('fs')
  var path = require('path')
  var _ = require('lodash')
  var Mustache = require('mustache')
  var events = ['pull_request.opened', 'pull_request.reopened']

  function getRepoPlugin (fullName) {
    const parts = fullName.split('/')
    const looksOk = (parts[0] === '..' || parts[1] === '..')
    if (looksOk) {
      robot.log.error('Cannot find plugin: invalid repo')
      return null
    }
    const repoPluginFile = path.join(__dirname, 'variables', parts[0], parts[1] + '.js')
    return fs.existsSync(repoPluginFile) ? require(repoPluginFile) : null
  }

  events.forEach(function (event) {
    // robot.on([event], async context => {
    robot.on(event, async context => {
      const options = context.repo({path: '.github/PR_REPLY_TEMPLATE.md.mustache'})
      const res = await context.github.repos.getContent(options)
      const template = Buffer.from(res.data.content, 'base64').toString()

      if (!template || template === '') {
        return
      }

      var tplVars = {
        pr: {
          number: context.payload.pull_request.number
        }
      }
      const repoPlugin = getRepoPlugin(context.payload.repository.full_name)
      if (repoPlugin) {
        _.merge(tplVars, repoPlugin(context.payload))
      }

      const body = Mustache.render(template, tplVars)
      return context.github.issues.createComment(context.issue({body: body}))
    })
  })
}
