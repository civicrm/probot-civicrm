module.exports = (robot) => {
  var fs = require('fs')
  var path = require('path')
  var _ = require('lodash')
  var Mustache = require('mustache')
  var events = ['pull_request.opened', 'pull_request.reopened']

  events.forEach(function (event) {
    // robot.on([event], async context => {
    robot.on(event, async context => {
      const options = context.repo({path: '.github/PR_REPLY_TEMPLATE.md.mustache'})
      const res = await context.github.repos.getContent(options)
      const template = Buffer.from(res.data.content, 'base64').toString()

      if (!template || template === '') {
        return
      }

      // const template =
      //     fs.readFileSync(path.join(__dirname, 'templates', 'pull_request.opened.md')).toString()

      var tplVars = {
        pr: {
          number: context.payload.pull_request.number
        }
      }

      const parts = context.payload.repository.full_name.split('/')
      if (parts[0] === '..' || parts[1] === '..') {
        robot.log.error('Invalid repo')
        return
      }
      const repoPlugin = path.join(__dirname, 'variables', parts[0], parts[1] + '.js')
      if (fs.existsSync(repoPlugin)) {
        _.merge(tplVars, require(repoPlugin)(context.payload))
      }

      const body = Mustache.render(template, tplVars)

      return context.github.issues.createComment(context.issue({body: body}))
    })
  })
}
