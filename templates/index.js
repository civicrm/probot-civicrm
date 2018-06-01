module.exports = (robot, extraDataDir) => {
  var fs = require('fs')
  var path = require('path')

  /**
   * Do a search to find the template, consulting the following:
   *
   * - {targetRepo}/.github/{templateName}.mustache.md
   * - {botRepo}/templates/{tgtOwner}/{tgtRepo}/{templateName}.mustache.md
   * - {botRepo}/templates/{tgtOwner}/_COMMON_/{templateName}.mustache.md
   * - {botRepo}/templates/_COMMON_/{templateName}.mustache.md
   *
   * @param context
   * @param templateName
   *   Ex: 'PR_REPLY_TEMPLATE'
   * @returns {*}
   *   String or null
   */
  async function findTemplateContent (context, templateName) {
    const suffix = '.mustache.md'
    const owner = context.payload.repository.owner.login
    const repo = context.payload.repository.name
    if (owner.match(/(\.\.|\/)/) || repo.match(/(\.\.|\/)/)) {
      robot.log.error('Cannot load templates: malformed owner or repo')
      return null
    }

    var relPath = '.github/' + templateName + suffix
    var fileContent = await getFileContent(context, relPath)
    if (fileContent !== null) {
      robot.log.debug('Found template in repo: ' + relPath)
      return fileContent
    }

    var files = [
      path.join(extraDataDir, owner, repo, templateName + suffix),
      path.join(extraDataDir, owner, '_COMMON_', templateName + suffix),
      path.join(extraDataDir, '_COMMON_', templateName + suffix)
    ]
    while (files.length > 0) {
      if (fs.existsSync(files[0])) {
        robot.log.debug('Found template in bot: ' + files[0])
        return fs.readFileSync(files[0]).toString()
      }
      files.shift()
    }

    return null
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

  return {
    find: findTemplateContent
  }
}
