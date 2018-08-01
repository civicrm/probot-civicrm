/**
 * Handle a request for `/update-status`.
 * router.all('/update-status', require('./update-status-handler')(robot))
 *
 * Request parameters:
 *   statusToken: An opaque string specifying where to direct the status message. (Technically, JWT with installation ID, PR of the SHA, etc)
 *   state: string
 *   description: string
 */
module.exports = (robot) => {
  async function updateStatusRoute (req, res) {
    const statusToken = JSON.parse(req.query.statusToken) // FIXME JWT process.env.STATUS_SECRET
    const log = robot.log.child({name: 'event', id: statusToken.id})
    const github = await robot.auth(statusToken.insid, log)

    await github.repos.createStatus({
      ...statusToken.tpl,
      state: req.query.state,
      description: req.query.description
    })

    res.end('Accepted status update')
  }

  return updateStatusRoute
}
