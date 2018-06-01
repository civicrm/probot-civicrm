module.exports = (robot) => {
  var fs = require('fs')
  var path = require('path')
  var _ = require('lodash')
  var Mustache = require('mustache')

  robot.on('pull_request.opened', async context => {
    robot.log.info('handle pr.opened')
    const template = await findTemplateContent(context, 'PR_REPLY_TEMPLATE')
    robot.log.info('tpl: [' + template + ']')
    if (!template || template === '') return
    const body = Mustache.render(template, buildTemplateVars(context.payload))
    return context.github.issues.createComment(context.issue({body: body}))
  })

  robot.on('issues.opened', async context => {
    robot.log.info('handle issue.opened')
    const template = await findTemplateContent(context, 'ISSUE_REPLY_TEMPLATE')
    robot.log.info('tpl: [' + template + ']')
    if (!template || template === '') return
    const body = Mustache.render(template, buildTemplateVars(context.payload))
    return context.github.issues.createComment(context.issue({body: body}))
  })

  /**
   * Do a search to find the template, consulting the following:
   *
   * - {targetRepo}/.github/{templateName}.mustache.md
   * - {botRepo}/templates/{tgtOwner}/{tgtRepo}/{templateName}.mustache.md
   * - {botRepo}/templates/{tgtOwner}/DEFAULT/{templateName}.mustache.md
   * - {botRepo}/templates/DEFAULT/{templateName}.mustache.md
   *
   * @param context
   * @param templateName
   *   Ex: 'PR_REPLY_TEMPLATE'
   * @returns {*}
   *   String or null
   */
  async function findTemplateContent (context, templateName) {
    const owner = context.payload.repository.owner.login
    const repo = context.payload.repository.name
    const suffix = '.mustache.md'
    var fileContent = null

    if (fileContent === null) {
      fileContent = await getFileContent(context, '.github/' + templateName + suffix)
    }

    var files = [
      path.join(__dirname, 'templates', owner, repo, templateName + suffix),
      path.join(__dirname, 'templates', owner, 'DEFAULT', templateName + suffix),
      path.join(__dirname, 'templates', 'DEFAULT', templateName + suffix)
    ]
    while (fileContent === null && files.length > 0) {
      if (fs.existsSync(files[0])) {
        fileContent = fs.readFileSync(files[0]).toString()
      }
      files.shift()
    }

    return fileContent
  }

  /**
   * Read one file from the repo
   *
   * @param context
   * @param relPath
   *   Ex: '.github/PR_REPLY_TEMPLATE.mustache.md'
   * @returns {*}
   *   String or null
   */
  async function getFileContent (context, relPath) {
    try {
      const options = context.repo({path: relPath})
      const res = await context.github.repos.getContent(options)
      const template = Buffer.from(res.data.content, 'base64').toString()
      return template
    } catch (error) {
      return null
    }
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
    },
    repository: function (repo) {
      return {
        owner: {
          login: repo.owner.login
        },
        name: repo.name,
        full_name: repo.full_name
      }
    }
  }

  function buildTemplateVars (payload) {
    var tplVars = {}
    for (var section in payload) {
      if (filters[section]) {
        tplVars[section] = filters[section](payload[section])
      }
    }
    const repoPlugin = getRepoPlugin(payload.repository.full_name)
    if (repoPlugin) _.merge(tplVars, repoPlugin(payload))
    return tplVars
  }

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
}
