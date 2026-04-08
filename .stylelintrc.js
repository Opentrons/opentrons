module.exports = {
  extends: ['stylelint-config-standard', 'stylelint-config-idiomatic-order'],

  ignoreFiles: [
    'api/**',
    '**/dist/**',
    '**/coverage/**',
    '**/venv/**',
    'docs/**',
    'components/lib/**',
    'js-package-testing/pack/**',
    'protocol-visualization/lib/**',
    'shared-data/**',
    'api-client/**',
    'react-api-client/**',
    'step-generation/**',
    'scripts/**',
    'hardware-testing/**',
    'discovery-client/**',
    'usb-bridge/**',
    'app-shell/**',
    'app-shell-odd/**',
    '__mocks__/**',
    'protocol-designer/fixtures/**',
    'components/src/__mocks__/**',
    'app/scripts/**',
    'e2e-testing/**',
  ],

  rules: {
    'selector-class-pattern': /^[a-z0-9_]+$/,

    // support css-modules
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['export', 'import', 'global', 'local'],
      },
    ],

    // number max precision
    'number-max-precision': [
      4,
      {
        ignoreProperties: [
          'transition',
          'width',
          'height',
          'max-height',
          'max-width',
          'min-width',
          'min-height',
          'flex',
        ],
      },
    ],

    'property-no-unknown': [
      true,
      {
        ignoreProperties: [
          // css-modules
          // TODO(mc, 2018-02-09): stop using composes
          'composes',
          'compose-with',

          // lost grid (http://lostgrid.org/docs.html)
          // TODO(mc, 2018-02-09): use stylelint-config-lost once stylelint-
          // config-css-modules property-no-unknown no longer conflicts
          'lost-align',
          'lost-center',
          'lost-column',
          'lost-flex-container',
          'lost-masonry-column',
          'lost-masonry-wrap',
          'lost-move',
          'lost-offset',
          'lost-row',
          'lost-unit',
          'lost-utility',
          'lost-waffle',
        ],
      },
    ],

    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          // TODO(mc, 2018-02-09): stop using @value
          'value',

          // lost grid (http://lostgrid.org/docs.html)
          // TODO(mc, 2018-02-09): use stylelint-config-lost once stylelint-
          // config-css-modules at-rule-no-unknown no longer conflicts
          'lost',
        ],
      },
    ],
  },
}
