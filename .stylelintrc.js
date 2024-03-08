module.exports = {
  processors: [
    [
      'stylelint-processor-styled-components',
      {
        ignoreFiles: ['**/*.css'],
      },
    ],
  ],

  extends: ['stylelint-config-standard', 'stylelint-config-styled-components'],

  ignoreFiles: ['api/**', '**/dist/**', '**/coverage/**', '**/venv/**'],

  rules: {
    'selector-class-pattern': /^[a-z0-9_]+$/,

    // support css-modules
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['export', 'import', 'global', 'local'],
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
