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

  // todo(mm, 2025-11-25): This is meant to allow loading images in e.g.
  // DeckFixtureSetupInstructionsModal, but it doesn't seem to be working.
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
}

export default config
