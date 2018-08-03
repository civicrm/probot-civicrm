const jwt = require('jsonwebtoken')

module.exports = {
  sign: function (data) {
    return jwt.sign({data: data}, process.env.STATUS_SECRET, { expiresIn: '1d', algorithm: 'HS256' })
  },
  verify: function (token) {
    const decoded = jwt.verify(token, process.env.STATUS_SECRET, {algorithms: ['HS256']})
    return decoded.data
  }
}
