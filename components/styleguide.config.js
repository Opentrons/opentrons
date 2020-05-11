'use strict'

const path = require('path')
const { baseConfig } = require('@opentrons/webpack-config')

module.exports = {
  styleguideDir: 'dist',
  webpackConfig: {
    module: baseConfig.module,
  },
  usageMode: 'expand',
  exampleMode: 'expand',
  // TODO(mc, 2017-12-22): generate these sections automatically by walking src
  sections: [
    {
      name: 'Alerts',
      components: 'src/alerts/[A-Z]*.js',
    },
    {
      name: 'Nav (buttons)',
      components: 'src/nav/[A-Z]*.js',
    },
    {
      name: 'Tabbed Nav',
      components: 'src/tabbedNav/[A-Z]*.js',
    },
    {
      name: 'Buttons',
      components: 'src/buttons/[A-Z]*.js',
    },
    {
      name: 'Form Components',
      components: 'src/forms/[A-Z]*.js',
    },
    {
      name: 'Icons',
      components: 'src/icons/[A-Z]*.js',
    },
    {
      name: 'Interaction Enhancers',
      components: 'src/interaction-enhancers/[A-Z]*.js',
    },
    {
      name: 'Lists',
      components: 'src/lists/[A-Z]*.js',
    },
    {
      name: 'Modals',
      components: 'src/modals/[A-Z]*.js',
    },
    {
      name: 'Deck',
      components: 'src/deck/[A-Z]*.js',
    },
    {
      name: 'SlotMap',
      components: 'src/slotmap/[A-Z]*.js',
    },
    {
      name: 'Instrument',
      components: 'src/instrument/[A-Z]*.js',
    },
    {
      name: 'Structure',
      components: 'src/structure/[A-Z]*.js',
    },
    {
      name: 'Tooltips',
      components: 'src/tooltips/[A-Z]*.js',
    },
    {
      name: 'Primitives',
      components: 'src/primitives/[A-Z]*.js',
    },
  ],
  getComponentPathLine(componentPath) {
    const name = path.basename(componentPath, '.js')

    return `import { ${name} } from '@opentrons/components'`
  },
  getExampleFilename(componentPath) {
    return componentPath.replace(/\.js$/, '.md')
  },
  styles: {
    StyleGuide: {
      '@global body': {
        fontFamily: "'Open Sans', sans-serif",
      },
      '@global .display-block': {
        display: 'block',
      },

      '@global .icon-showcase': {
        display: 'grid',
        gridTemplateColumns: 'auto auto auto',
      },
      '@global .icon-showcase span': {
        display: 'flex',
        height: '2rem',
        alignItems: 'center',
        margin: '0.25rem',
      },
      '@global .icon-showcase > span > svg': {
        height: '100%',
      },
      '@global .icon-showcase > span > span': {
        paddingLeft: '1rem',
      },

      '@global .width-auto': {
        width: 'auto !important',
      },
      '@global .width-3-rem': {
        width: '3rem !important',
      },
      '@global .height-3-rem': {
        height: '3rem !important',
      },
      '@global .height-40-rem': {
        height: '40rem !important',
      },
      '@global .dark_background': {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
      },
      '@global .dark_gray': {
        color: '#4a4a4a',
      },
      '@global .orange': {
        color: '#f5a623',
      },
    },
  },
}
