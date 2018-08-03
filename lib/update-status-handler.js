const statusTokenSvc = require('./update-status-token')

/**
 * Handle a request for `/update-status`.
 * router.all('/update-status', require('./update-status-handler')(robot))
 *
 * Request parameters:
 *   statusToken: An opaque string specifying where to direct the status message. (Technically, JWT with installation ID, PR of the SHA, etc)
 *   state: string
 *   target_url: string
 *   description: string
 */
module.exports = (robot) => {
  async function updateStatusRoute (req, res) {
    if (!req.query.statusToken || !req.query.state || !req.query.description) {
      res.status(400).end('Missing one of the required fields (statusToken,state,description)')
      return
    }

    var statusToken
    try {
      statusToken = statusTokenSvc.verify(req.query.statusToken)
    } catch (err) {
      robot.log.warn('update-status received invalid statusToken')
      res.status(400).end('Failed to decode statusToken')
      return
    }

    const log = robot.log.child({name: 'event', id: statusToken.eventId})
    const github = await robot.auth(statusToken.instlId, log)

    await github.repos.createStatus({
      ...statusToken.tpl,
      state: req.query.state,
      target_url: req.query.target_url ? req.query.target_url : '',
      description: req.query.description
    })

    res.status(200).end('Accepted status update')
  }

  return updateStatusRoute
}
