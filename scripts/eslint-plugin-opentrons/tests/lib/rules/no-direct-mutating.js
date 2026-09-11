'use strict'

const { RuleTester } = require('eslint')
const rule = require('../../../lib/rules/no-direct-mutating')

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
})

ruleTester.run('no-direct-mutating', rule, {
  valid: [
    {
      code: `
        import { getProtocol } from '@opentrons/api-client'
        getProtocol(host, id)
      `,
    },
    {
      code: `
        import { RUN_STATUS_IDLE } from '@opentrons/api-client'
        const status = RUN_STATUS_IDLE
      `,
    },
    {
      code: `
        import { deleteProtocol } from '@opentrons/api-client'
        vi.mocked(deleteProtocol)
      `,
    },
    {
      code: `
        import { createLiveCommand } from '@opentrons/react-api-client'
        createLiveCommand({})
      `,
    },
    {
      code: `
        const { createProtocol } = someOtherModule
        createProtocol()
      `,
    },
  ],
  invalid: [
    {
      code: `
        import { deleteProtocol } from '@opentrons/api-client'
        deleteProtocol(host, id)
      `,
      errors: [
        {
          messageId: 'noDirectMutatingCall',
          data: { name: 'deleteProtocol' },
        },
      ],
    },
    {
      code: `
        import { createProtocol as makeProtocol } from '@opentrons/api-client'
        makeProtocol(host, files)
      `,
      errors: [
        {
          messageId: 'noDirectMutatingCall',
          data: { name: 'createProtocol' },
        },
      ],
    },
    {
      code: `
        import * as ApiClient from '@opentrons/api-client'
        ApiClient.updatePipetteSettings(host, id, data)
      `,
      errors: [
        {
          messageId: 'noDirectMutatingCall',
          data: { name: 'updatePipetteSettings' },
        },
      ],
    },
    {
      code: `
        import { deleteRun, getProtocol } from '@opentrons/api-client'
        getProtocol(host, id).then(() => deleteRun(host, runId))
      `,
      errors: [
        {
          messageId: 'noDirectMutatingCall',
          data: { name: 'deleteRun' },
        },
      ],
    },
    {
      code: `
        import { updateDeckConfiguration } from '@opentrons/api-client'
        updateDeckConfiguration(host, deckConfig, userNotes)
      `,
      errors: [
        {
          messageId: 'noDirectMutatingCall',
          data: { name: 'updateDeckConfiguration' },
        },
      ],
    },
  ],
})
