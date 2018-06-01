module.exports = (robot) => {
  var fs = require('fs')
  var path = require('path')
  var _ = require('lodash')
  var Mustache = require('mustache')

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

  async function getFileContent (context, relPath) {
    const options = context.repo({path: relPath})
    const res = await context.github.repos.getContent(options)
    const template = Buffer.from(res.data.content, 'base64').toString()
    return template
  }

  /**
   * A list of functions which filter the available information about
   * various objects -- using a whitelist.
   */
  var filters = {
    pull_request: function (pr) {
      return {
        number: pr.number,
        base: {
          label: pr.base.label,
          ref: pr.base.ref,
          repo: {
            name: pr.base.repo.name,
            full_name: pr.base.repo.full_name
          }
        },
        head: {
          label: pr.head.label,
          ref: pr.head.ref,
          repo: {
            name: pr.head.repo.name,
            full_name: pr.head.repo.full_name
          }
        }
      }
    },
    issue: function (issue) {
      return {
        number: issue.number
      }
    }
  }

  robot.on('pull_request.opened', async context => {
    const template = await getFileContent(context, '.github/PR_REPLY_TEMPLATE.mustache.md')
    if (!template || template === '') return

    var tplVars = {}
    tplVars.pr = filters.pull_request(context.payload.pull_request)
    const repoPlugin = getRepoPlugin(context.payload.repository.full_name)
    if (repoPlugin) _.merge(tplVars, repoPlugin(context.payload))

    const body = Mustache.render(template, tplVars)
    return context.github.issues.createComment(context.issue({body: body}))
  })

  robot.on('issue.opened', async context => {
    const template = await getFileContent(context, '.github/ISSUE_REPLY_TEMPLATE.mustache.md')
    if (!template || template === '') return

    var tplVars = {}
    tplVars.issue = filters.issue(context.payload.issue)
    const repoPlugin = getRepoPlugin(context.payload.repository.full_name)
    if (repoPlugin) _.merge(tplVars, repoPlugin(context.payload))

    const body = Mustache.render(template, tplVars)
    return context.github.issues.createComment(context.issue({body: body}))
  })
}
