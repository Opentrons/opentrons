'use strict'

const path = require('path')

module.exports = {
  styleguideDir: 'dist',
  usageMode: 'expand',
  exampleMode: 'expand',
  // TODO(mc, 2017-12-22): generate these sections automatically by walking src
  sections: [
    {
      name: 'Alerts',
      components: 'src/alerts/[A-Z]*.ts',
    },
    {
      name: 'Nav (buttons)',
      components: 'src/nav/[A-Z]*.ts',
    },
    {
      name: 'Tabbed Nav',
      components: 'src/tabbedNav/[A-Z]*.ts',
    },
    {
      name: 'Buttons',
      components: 'src/buttons/[A-Z]*.ts',
    },
    {
      name: 'Form Components',
      components: 'src/forms/[A-Z]*.ts',
    },
    {
      name: 'Icons',
      components: 'src/icons/[A-Z]*.ts',
    },
    {
      name: 'Interaction Enhancers',
      components: 'src/interaction-enhancers/[A-Z]*.ts',
    },
    {
      name: 'Lists',
      components: 'src/lists/[A-Z]*.ts',
    },
    {
      name: 'Modals',
      components: 'src/modals/[A-Z]*.ts',
    },
    {
      name: 'Deck',
      components: 'src/deck/[A-Z]*.ts',
    },
    {
      name: 'SlotMap',
      components: 'src/slotmap/[A-Z]*.ts',
    },
    {
      name: 'Instrument',
      components: 'src/instrument/[A-Z]*.ts',
    },
    {
      name: 'Structure',
      components: 'src/structure/[A-Z]*.ts',
    },
    {
      name: 'Tooltips',
      components: 'src/tooltips/[A-Z]*.ts',
    },
    {
      name: 'Primitives',
      content: 'src/primitives/README.md',
      components: 'src/primitives/[A-Z]*.ts',
    },
  ],
  getComponentPathLine(componentPath) {
    const name = path.basename(componentPath, '.ts')

    return `import { ${name} } from '@opentrons/components'`
  },
  getExampleFilename(componentPath) {
    return componentPath.replace(/\.ts$/, '.md')
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
