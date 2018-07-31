/**
 * The `variables` service provides an algorithm for resolving variables.
 * It includes a a few standard variables, and it also loads extensions
 * from the `config` folder.
 */
module.exports = (robot, extraDataDir) => {
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

  return {
    generate: function generate (context) {
      const payload = context.payload
      const owner = context.payload.repository.owner.login
      const repo = context.payload.repository.name
      if (owner.match(/(\.\.|\/)/) || repo.match(/(\.\.|\/)/)) {
        robot.log.error('Cannot generate tokens: malformed owner or repo')
        return {}
      }

      var tplVars = {}
      for (var section in payload) {
        if (filters[section]) {
          tplVars[section] = filters[section](payload[section])
        }
      }

      var plugins = [
        path.join(extraDataDir, '_COMMON_', 'variables.js'),
        path.join(extraDataDir, owner, '_COMMON_', 'variables.js'),
        path.join(extraDataDir, owner, repo, 'variables.js')
      ]
      for (var pid in plugins) {
        if (fs.existsSync(plugins[pid])) {
          _.merge(tplVars, require(plugins[pid])(context))
        }
      }

      return tplVars
    }
  }
}
