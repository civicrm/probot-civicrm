/**
 * Handle a request for `/update-status`.
 * router.all('/update-status', require('./update-status-handler')(robot))
 */
module.exports = (robot) => {
  async function updateStatusRoute (req, res) {
    //console.log({'STATUS_SECRET': process.env.STATUS_SECRET})
    //console.log(req.query)
    res.end('Accepted status update')
    /*
    const log = robot.log.child({name: 'event', id: req.query.eventId})
    const github = await robot.auth(req.query.installId, log)

    /*
    const statusTemplate = {
      owner: 'totten',
      repo: 'githubtest',
      sha: '74874d028346037875657ab0aeeaab222fabcfc7',
      context: 'carrot'
    }
    /*
    await github.repos.createStatus({
      ...statusTemplate,
      state: 'success',
      description: 'It all worked out in the end.'
    })
    */
  }

  return updateStatusRoute
}
