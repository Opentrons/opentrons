const path = require('path')

module.exports = {
  stories: [
    '../components/**/*.stories.@(js|jsx|ts|tsx)',
    '../app/**/*.stories.@(js|jsx|ts|tsx)',
    '../protocol-designer/**/*.stories.@(js|jsx|ts|tsx)',
    '../opentrons-ai-client/**/*.stories.@(js|jsx|ts|tsx)',
    '../components/**/*.mdx',
    // ToDo activate when needed
    // '../app/**/*.mdx',
    // '../protocol-designer/**/*.mdx',
    // '../opentrons-ai-client/**/*.mdx',
  ],

  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    'storybook-addon-pseudo-states',
  ],

  staticDirs: ['../app/src/assets'],

  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  docs: {
    autodocs: true,
  },

  async viteFinal(config) {
    config.resolve = config.resolve || {}
    config.resolve.alias = config.resolve.alias || {}

    // Add the same alias as in app/vite.config.mts to support /app/ imports
    config.resolve.alias['/app/'] = path.resolve(__dirname, '../app/src/') + '/'

    return config
  },
}
