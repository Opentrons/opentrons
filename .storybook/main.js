const path = require('path')

const { baseConfig } = require('@opentrons/webpack-config')

module.exports = {
  webpackFinal: config => {
    // grab rules to parse out story files
    const storyRules = config.module.rules.filter(r => {
      return String(r.test).includes('stor') ? r : null
    })
    return {
      ...config,
      module: {
        ...config.module,
        rules: [...baseConfig.module.rules, ...storyRules],
      },
    }
  },
  stories: ['../components/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials'],
}
