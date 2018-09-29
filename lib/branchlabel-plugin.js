/**
 * The branchlabel plugin keep applies a label to every PR based on the name of the base-branch.
 */
module.exports = (robot) => {
  // var path = require('path')

  async function findCreateLabel (context, labelName, defaultColor) {
    const repo = context.repo()

    try {
      await context.github.issues.getLabel({...repo, name: labelName})
    } catch (err) {
      if (err.code !== 404) throw err
      robot.log.info('Creating label "' + labelName + '" on "' + repo.owner + '/' + repo.repo + '"')
      await context.github.issues.createLabel({...repo, name: labelName, color: defaultColor})
    }
  }

  robot.on(['pull_request.opened', 'pull_request.reopened'], async context => {
    const repo = context.repo()

    const repoAuthz = await robot.checkRepoAuthz(repo.owner, repo.repo)
    if (!repoAuthz) {
      robot.log.debug('Ignore unauthorized repo: ' + repo.owner + '/' + repo.repo)
      return
    }
    // TODO: some kind of opt-in

    const labelName = context.payload.pull_request.base.ref
    await findCreateLabel(context, labelName, 'ededed')
    return context.github.issues.addLabels(context.issue({
      labels: [labelName]
    }))
  })

  robot.on(['pull_request.edited'], async context => {
    if (!context.payload.changes || !context.payload.changes.base || !context.payload.changes.base.ref) return
    const repo = context.repo()

    const repoAuthz = await robot.checkRepoAuthz(repo.owner, repo.repo)
    if (!repoAuthz) {
      robot.log.debug('Ignore unauthorized repo: ' + repo.owner + '/' + repo.repo)
      return
    }
    // TODO: some kind of opt-in

    const labelName = context.payload.pull_request.base.ref
    await findCreateLabel(context, labelName, 'ededed')
    await context.github.issues.addLabels(context.issue({
      labels: [labelName]
    }))
    return context.github.issues.removeLabel(context.issue({
      name: context.payload.changes.base.ref.from
    }))
  })
}
