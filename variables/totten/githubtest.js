module.exports = (payload) => {
  return {
    ci: {
      browse_url: function () {
        return 'http://site-list.example.com/?filter=example-' +
          payload.pull_request.number + '-' + '%2A'
      }
    }
  }
}
