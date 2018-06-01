module.exports = (robot) => {
  var fs = require('fs')
  var path = require('path')
  var _ = require('lodash')

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

  function getRepoPlugin (fullName) {
    const parts = fullName.split('/')
    const looksOk = (parts[0] === '..' || parts[1] === '..')
    if (looksOk) {
      // robot.log.error('Cannot find plugin: invalid repo')
      return null
    }
    const repoPluginFile = path.join(__dirname, parts[0], parts[1] + '.js')
    return fs.existsSync(repoPluginFile) ? require(repoPluginFile) : null
  }

  return {
    generate: function generate (context) {
      const payload = context.payload
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
  }
}
