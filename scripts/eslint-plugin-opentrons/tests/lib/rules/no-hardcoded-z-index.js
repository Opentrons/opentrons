'use strict'

const { RuleTester } = require('eslint')
const rule = require('../../../lib/rules/no-hardcoded-z-index')

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
})

ruleTester.run('no-hardcoded-z-index', rule, {
  valid: [
    { code: 'const style = { zIndex: Z_INDEX.MODALS }' },
    { code: 'const style = { zIndex: Z_INDEX.COMPLIANCE_MODALS - 1 }' },
    { code: 'const style = { zIndex: modalZIndex ?? Z_INDEX.MODALS }' },
    { code: 'const style = { zIndex: "auto" }' },
    { code: 'const style = { margin: 10 }' },
    { code: '<Box zIndex={Z_INDEX.BASE} />' },
    { code: '<Modal zIndexOverlay={Z_INDEX.LOGIN_MODAL} />' },
    { code: '<Box zIndex={toastZIndex} />' },
    { code: 'const zIndex = Z_INDEX.TOASTS' },
    { code: 'function f({ zIndex = Z_INDEX.BASE }) {}' },
    { code: 'css`z-index: var(--z-index-menus);`' },
    { code: 'css`z-index: ${Z_INDEX.BASE};`' },
    {
      code: 'styled.div`z-index: calc(var(--z-index-compliance-modals) - 1);`',
    },
    { code: 'obj.zIndex = Z_INDEX.DETAILS' },
  ],
  invalid: [
    {
      code: 'const style = { zIndex: 1 }',
      errors: [{ messageId: 'noHardcodedZIndex' }],
    },
    {
      code: 'const style = { zIndex: -1 }',
      errors: [{ messageId: 'noHardcodedZIndex' }],
    },
    {
      code: 'const style = { "z-index": "10" }',
      errors: [{ messageId: 'noHardcodedZIndex' }],
    },
    {
      code: 'const style = { zIndexOverlay: 100 }',
      errors: [{ messageId: 'noHardcodedZIndex' }],
    },
    {
      code: '<Box zIndex={2} />',
      errors: [{ messageId: 'noHardcodedZIndex' }],
    },
    {
      code: '<Box zIndex="3" />',
      errors: [{ messageId: 'noHardcodedZIndex' }],
    },
    {
      code: '<Modal zIndexOverlay={105} />',
      errors: [{ messageId: 'noHardcodedZIndex' }],
    },
    {
      code: 'css`z-index: 5;`',
      errors: [{ messageId: 'noHardcodedZIndex' }],
    },
    {
      code: 'styled.div`z-index: 4;`',
      errors: [{ messageId: 'noHardcodedZIndex' }],
    },
    {
      code: 'css`z-index: ${8};`',
      errors: [{ messageId: 'noHardcodedZIndex' }],
    },
    {
      code: 'const zIndex = 9',
      errors: [{ messageId: 'noHardcodedZIndex' }],
    },
    {
      code: 'obj.zIndex = 7',
      errors: [{ messageId: 'noHardcodedZIndex' }],
    },
    {
      code: 'function f({ zIndex = 6 }) {}',
      errors: [{ messageId: 'noHardcodedZIndex' }],
    },
  ],
})
