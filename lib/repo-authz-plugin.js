/**
 * Register an authorization function which determines if service is
 * authorized for a particular repository.
 */
module.exports = async (robot, configFile) => {
  robot.checkRepoAuthz = async function checkRepoAuthz (owner, repo) {
    const regexes = require(configFile)

    for (var i in regexes) {
      const regex = regexes[i]
      if (owner.match(regex[0]) && repo.match(regex[1])) {
        return true
      }
    }
    return false
  }
}
