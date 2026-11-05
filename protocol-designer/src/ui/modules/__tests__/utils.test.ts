import { describe, expect, it } from 'vitest'

import {
  ABSORBANCE_READER_TYPE,
  FLEX_ROBOT_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  OT2_ROBOT_TYPE,
  TC_MODULE_LOCATION_OT2,
  TC_MODULE_LOCATION_OT3,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  VACUUM_MODULE_LOCATION,
  VACUUM_MODULE_TYPE,
} from '@opentrons/shared-data'

import { getModuleDisplayLocation } from '../utils'

import type { ModuleOnDeck } from '/protocol-designer/step-forms'

describe('getModuleDisplayLocation', () => {
  it('returns the correct display location for a thermocycler module on OT-2', () => {
    const moduleOnDeck = { type: THERMOCYCLER_MODULE_TYPE } as ModuleOnDeck
    const result = getModuleDisplayLocation(moduleOnDeck, OT2_ROBOT_TYPE)
    expect(result).toEqual(TC_MODULE_LOCATION_OT2)
  })
  it('returns the correct display location for a thermocycler module on Flex', () => {
    const moduleOnDeck = { type: THERMOCYCLER_MODULE_TYPE } as ModuleOnDeck
    const result = getModuleDisplayLocation(moduleOnDeck, FLEX_ROBOT_TYPE)
    expect(result).toEqual(TC_MODULE_LOCATION_OT3)
  })
  it('returns the correct display location for a vacuum module on Flex', () => {
    const moduleOnDeck = { type: VACUUM_MODULE_TYPE } as ModuleOnDeck
    const result = getModuleDisplayLocation(moduleOnDeck, FLEX_ROBOT_TYPE)
    expect(result).toEqual(VACUUM_MODULE_LOCATION)
  })
  ;[
    MAGNETIC_MODULE_TYPE,
    TEMPERATURE_MODULE_TYPE,
    HEATERSHAKER_MODULE_TYPE,
    ABSORBANCE_READER_TYPE,
    FLEX_STACKER_MODULE_TYPE,
  ].forEach(type => {
    it(`returns the slot for ${type}`, () => {
      const moduleOnDeck = {
        type,
        slot: '1',
      } as ModuleOnDeck
      const result = getModuleDisplayLocation(moduleOnDeck, OT2_ROBOT_TYPE)
      expect(result).toEqual('1')
    })
  })
})
