module.exports = (context) => {
  // const payload = context.payload
  return {
    ci: {
      foobar: function () {
        return 'whimsy'
      }
    }
  }
}
