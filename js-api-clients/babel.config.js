'use strict'

module.exports = {
  presets: [
    ['@babel/env', { useBuiltIns: 'usage', corejs: '3.10' }],
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
}
