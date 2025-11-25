import path from 'node:path'

import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
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
    options: {
      builder: {
        // Storybook would normally find the Vite config automatically.
        // That doesn't work for us because we have one monorepo-wide Storybook
        // installation, while each project has its own local Vite config.
        // So we treat Storybook as its own Vite project with its own config.
        viteConfigPath: '.storybook/vite.config.mjs',
      },
    },
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

export default config
