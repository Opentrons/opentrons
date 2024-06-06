'use strict'

module.exports = {
  env: {
    // Note(isk: 3/2/20): Must have babel-plugin-styled-components in each env,
    // see here for further details: s https://styled-components.com/docs/tooling#babel-plugin
    production: {
      plugins: ['babel-plugin-styled-components', 'babel-plugin-unassert'],
    },
    development: {
      plugins: ['babel-plugin-styled-components'],
    },
    test: {
      plugins: [
        // NOTE(mc, 2020-05-08): disable ssr, displayName to fix toHaveStyleRule
        // https://github.com/styled-components/jest-styled-components/issues/294
        ['babel-plugin-styled-components', { ssr: false, displayName: false }],
      ],
    },
  },
}
