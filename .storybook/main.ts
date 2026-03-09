module.exports = {
  stories: [
    '../components/**/*.stories.@(js|jsx|ts|tsx)',
    '../app/**/*.stories.@(js|jsx|ts|tsx)',
    '../protocol-designer/**/*.stories.@(js|jsx|ts|tsx)',
    '../opentrons-ai-client/**/*.stories.@(js|jsx|ts|tsx)',
    '../components/**/*.mdx',
    '../app/**/*.mdx',
    '../protocol-designer/**/*.mdx',
    '../opentrons-ai-client/**/*.mdx',
  ],

  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    'storybook-addon-pseudo-states',
  ],

  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  docs: {
    autodocs: true,
  },
}
