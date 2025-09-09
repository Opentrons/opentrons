import { describe, expect, it } from 'vitest'

import {
  TEMPERATURE_MODULE_TYPE,
  TEMPERATURE_MODULE_V1,
} from '@opentrons/shared-data'

import { getModuleOnSlot } from '../util'

import type { ModuleOnDeck } from '/protocol-designer/step-forms'

describe('getModuleOnSlot', () => {
  it('should return false and module id', () => {
    expect(
      getModuleOnSlot({}, {
        slot: '1',
        id: 'mockId',
        type: TEMPERATURE_MODULE_TYPE,
        model: TEMPERATURE_MODULE_V1,
        moduleState: {},
      } as ModuleOnDeck)
    ).toStrictEqual({ isModuleInUse: false, moduleId: 'mockId' })
  })
  it('should return true and module id', () => {
    expect(
      getModuleOnSlot(
        {
          step: {
            id: 'step',
            stepType: 'temperature',
            moduleId: 'mockId',
          },
        },
        {
          slot: '1',
          id: 'mockId',
          type: TEMPERATURE_MODULE_TYPE,
          model: TEMPERATURE_MODULE_V1,
          moduleState: {},
        } as ModuleOnDeck
      )
    ).toStrictEqual({ isModuleInUse: true, moduleId: 'mockId' })
  })
})
