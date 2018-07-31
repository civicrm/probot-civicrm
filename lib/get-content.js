/**
 * Read one file from the repo
 *
 * @param context
 * @param relPath
 *   Ex: '.github/PR_REPLY_TEMPLATE.mustache.md'
 * @returns {*}
 *   String or null
 */
module.exports = async (context, relPath) => {
  try {
    const options = context.repo({path: relPath})
    const res = await context.github.repos.getContent(options)
    const template = Buffer.from(res.data.content, 'base64').toString()
    return template
  } catch (error) {
    return null
  }
}
