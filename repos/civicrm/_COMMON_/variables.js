module.exports = (context) => {
  const payload = context.payload
  return {
    ci: {
      browse_url: function () {
        return 'http://site-list.test-ubu1204-5.civicrm.org/?filter=core-' +
          payload.pull_request.number + '-' + '%2A'
      }
    }
  }
}
