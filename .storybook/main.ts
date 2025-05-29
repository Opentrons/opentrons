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

  async viteFinal(config) {
    // Add linaria plugin for CSS-in-JS support
    const { default: linaria } = await import('@wyw-in-js/vite')

    config.plugins = config.plugins || []
    config.plugins.push(
      linaria({
        include: ['**/*.{ts,tsx}', '../components/**/*.{ts,tsx}'],
        babelOptions: {
          // configFile: true,
          presets: [
            '@babel/preset-typescript', // Make sure TS is handled before/by Linaria's preset
            '@babel/preset-react', // React preset
            '@wyw-in-js/babel-preset', // Linaria preset
          ],
        },
      })
    )

    return config
  },
}
