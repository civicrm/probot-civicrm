const jwt = require('jsonwebtoken')

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
    var decoded
    try {
      decoded = jwt.verify(req.query.statusToken, process.env.STATUS_SECRET, {algorithms: ['HS256']})
    } catch (err) {
      robot.log.warn('update-status received invalid statusToken')
      res.status(400).end('Failed to decode statusToken')
      return
    }
    const statusToken = decoded.data

    const log = robot.log.child({name: 'event', id: statusToken.eventId})
    const github = await robot.auth(statusToken.instlId, log)

    await github.repos.createStatus({
      ...statusToken.tpl,
      state: req.query.state,
      description: req.query.description
    })

    res.status(200).end('Accepted status update')
  }

  return updateStatusRoute
}
