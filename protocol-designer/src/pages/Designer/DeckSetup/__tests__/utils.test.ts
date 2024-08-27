import { describe, it, expect } from 'vitest'
import {
  FLEX_ROBOT_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_BLOCK_V1,
  MAGNETIC_MODULE_TYPE,
  MAGNETIC_MODULE_V1,
  OT2_ROBOT_TYPE,
  THERMOCYCLER_MODULE_V1,
  THERMOCYCLER_MODULE_V2,
} from '@opentrons/shared-data'
import { getModuleModelsBySlot, getOt2HeaterShakerDeckErrors } from '../utils'
import { FLEX_MODULE_MODELS, OT2_MODULE_MODELS } from '../constants'

describe('getModuleModelsBySlot', () => {
  it('renders no modules for ot-2 middle slot', () => {
    expect(getModuleModelsBySlot(false, OT2_ROBOT_TYPE, '5')).toEqual([])
  })
  it('renders all ot-2 modules for slot 7', () => {
    expect(getModuleModelsBySlot(false, OT2_ROBOT_TYPE, '7')).toEqual(
      OT2_MODULE_MODELS
    )
  })
  it('renders ot-2 modules minus thermocyclers for slot 1', () => {
    const noTC = OT2_MODULE_MODELS.filter(
      model =>
        model !== THERMOCYCLER_MODULE_V1 && model !== THERMOCYCLER_MODULE_V2
    )
    expect(getModuleModelsBySlot(false, OT2_ROBOT_TYPE, '1')).toEqual(noTC)
  })
  it('renders ot-2 modules minus thermocyclers & heater-shaker for slot 9', () => {
    const noTCAndHS = OT2_MODULE_MODELS.filter(
      model =>
        model !== THERMOCYCLER_MODULE_V1 &&
        model !== THERMOCYCLER_MODULE_V2 &&
        model !== HEATERSHAKER_MODULE_V1
    )
    expect(getModuleModelsBySlot(false, OT2_ROBOT_TYPE, '9')).toEqual(noTCAndHS)
  })
  it('renders flex modules for middle slots', () => {
    expect(getModuleModelsBySlot(false, FLEX_ROBOT_TYPE, 'B2')).toEqual([
      MAGNETIC_BLOCK_V1,
    ])
  })
  it('renders all flex modules for B1', () => {
    expect(getModuleModelsBySlot(false, FLEX_ROBOT_TYPE, 'B1')).toEqual(
      FLEX_MODULE_MODELS
    )
  })
  it('renders all flex modules for C1', () => {
    const noTC = FLEX_MODULE_MODELS.filter(
      model => model !== THERMOCYCLER_MODULE_V2
    )
    expect(getModuleModelsBySlot(false, FLEX_ROBOT_TYPE, 'C1')).toEqual(noTC)
  })
})

describe('getOt2HeaterShakerDeckErrors', () => {
  it('renders no error when there is no conflict', () => {
    expect(
      getOt2HeaterShakerDeckErrors({
        modules: {},
        selectedSlot: '1',
        selectedModel: MAGNETIC_MODULE_V1,
      })
    ).toEqual(null)
  })
  it('renders H-S adjacent error', () => {
    expect(
      getOt2HeaterShakerDeckErrors({
        modules: {
          hs: {
            model: HEATERSHAKER_MODULE_V1,
            type: HEATERSHAKER_MODULE_TYPE,
            id: 'mockId',
            slot: '4',
            moduleState: {} as any,
          },
        },
        selectedSlot: '1',
        selectedModel: MAGNETIC_MODULE_V1,
      })
    ).toEqual('heater_shaker_adjacent')
  })
  it('renders module adjacent error', () => {
    expect(
      getOt2HeaterShakerDeckErrors({
        modules: {
          hs: {
            model: MAGNETIC_MODULE_V1,
            type: MAGNETIC_MODULE_TYPE,
            id: 'mockId',
            slot: '4',
            moduleState: {} as any,
          },
        },
        selectedSlot: '1',
        selectedModel: HEATERSHAKER_MODULE_V1,
      })
    ).toEqual('heater_shaker_adjacent_to')
  })
})
