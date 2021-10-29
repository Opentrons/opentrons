'use strict'

const { baseConfig } = require('@opentrons/webpack-config')

module.exports = {
  webpackFinal: config => ({
    ...config,
    module: { ...config.module, rules: baseConfig.module.rules },
    plugins: [...config.plugins, ...baseConfig.plugins],
  }),
  stories: [
    '../components/**/*.stories.@(js|jsx|ts|tsx)',
    '../app/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials'],
}
