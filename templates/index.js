module.exports = (robot) => {
  var fs = require('fs')
  var path = require('path')

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

    var fileContent = await getFileContent(context, '.github/' + templateName + suffix)
    if (fileContent !== null) return fileContent

    var files = [
      path.join(__dirname, 'templates', owner, repo, templateName + suffix),
      path.join(__dirname, 'templates', owner, 'DEFAULT', templateName + suffix),
      path.join(__dirname, 'templates', 'DEFAULT', templateName + suffix)
    ]
    while (files.length > 0) {
      if (fs.existsSync(files[0])) {
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
