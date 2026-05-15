import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

import type { StorybookConfig } from '@storybook/react-vite'

const require = createRequire(import.meta.url)

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
    getAbsolutePath('@storybook/addon-links'),
    getAbsolutePath('@storybook/addon-docs'),
    getAbsolutePath('storybook-addon-pseudo-states'),
    '@chromatic-com/storybook',
  ],

  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {
      builder: {
        // Storybook would normally find the Vite config automatically.
        // That doesn't work for us because we have one monorepo-wide Storybook
        // installation, while each project has its own local Vite config.
        // So we treat Storybook as its own Vite project with its own config.
        viteConfigPath: '.storybook/vite.config.mts',
      },
    },
  },

  docs: {},

  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
}

export default config

function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')))
}
