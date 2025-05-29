const shaker = require('@linaria/shaker').default

module.exports = {
  rules: [
    {
      action: shaker,
    },
    {
      test: /.json/,
      action: 'ignore',
    },
    {
      test: /node_modules/,
      action: 'ignore',
    },
  ],
}
