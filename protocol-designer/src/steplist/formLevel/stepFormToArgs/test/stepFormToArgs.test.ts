import { describe, it, expect } from 'vitest'
import { _castForm } from '../index'
import { FormData } from '../../../../form-types'

// NOTE(IL, 2020-09-24): I think the real solution to validating the
// output of hydration/casting is static typing as per #3161
// Because if we forget to change the value casters when adding/modifying fields,
// and we also forget to modify these tests covering the value casters, these tests
// won't catch any problems.

describe('form casting', () => {
  it('should cast moveLiquid form fields', () => {
    const input: FormData = {
      id: 'stepId',
      stepType: 'moveLiquid',
      stepName: 'transfer',
      stepDetails: 'some details',
      aspirate_airGap_checkbox: false,
      aspirate_airGap_volume: '1',
      aspirate_delay_checkbox: false,
      aspirate_delay_mmFromBottom: '1',
      aspirate_delay_seconds: '1',
      aspirate_flowRate: null,
      aspirate_labware: 'FAKE_LABWARE_DEF',
      aspirate_mix_checkbox: false,
      aspirate_mix_times: null,
      aspirate_mix_volume: null,
      aspirate_mmFromBottom: '1',
      aspirate_touchTip_checkbox: false,
      aspirate_wellOrder_first: 't2b',
      aspirate_wellOrder_second: 'l2r',
      aspirate_wells_grouped: false,
      aspirate_wells: ['A1'],
      blowout_checkbox: false,
      blowout_location: 'fixedTrash',
      changeTip: 'always',
      dispense_delay_checkbox: false,
      dispense_delay_mmFromBottom: '0.5',
      dispense_delay_seconds: '1',
      dispense_flowRate: null,
      dispense_labware: 'FAKE_LABWARE_DEF',
      dispense_mix_checkbox: false,
      dispense_mix_times: null,
      dispense_mix_volume: null,
      dispense_mmFromBottom: '0.5',
      dispense_touchTip_checkbox: false,
      dispense_wellOrder_first: 't2b',
      dispense_wellOrder_second: 'l2r',
      dispense_wells: ['A1'],
      disposalVolume_checkbox: true,
      disposalVolume_volume: '1',
      path: 'single',
      pipette: 'FAKE_PIPETTE',
      preWetTip: false,
      volume: '5',
      meta: {},
    }
    expect(_castForm(input)).toEqual({
      ...input,
      aspirate_airGap_volume: 1,
      aspirate_delay_mmFromBottom: 1,
      aspirate_delay_seconds: 1,
      aspirate_mix_times: 0,
      aspirate_mix_volume: 0,
      aspirate_mmFromBottom: 1,
      dispense_delay_mmFromBottom: 0.5,
      dispense_delay_seconds: 1,
      dispense_mix_times: 0,
      dispense_mix_volume: 0,
      dispense_mmFromBottom: 0.5,
      disposalVolume_volume: 1,
      volume: 5,
    })
  })

  it('should cast mix form fields', () => {
    const input: FormData = {
      id: 'stepId',
      stepType: 'mix',
      stepName: 'mix',
      stepDetails: '',
      changeTip: 'always',
      labware: 'FAKE_LABWARE_DEF',
      mix_wellOrder_first: 't2b',
      mix_wellOrder_second: 'l2r',
      blowout_checkbox: false,
      blowout_location: 'fixedTrash',
      mix_mmFromBottom: 0.5,
      pipette: 'FAKE_PIPETTE',
      volume: '5',
      wells: ['A1', 'A2'],
      times: '2',
      meta: {},
      aspirate_delay_checkbox: true,
      dispense_delay_checkbox: false,
      aspirate_delay_seconds: '2',
      dispense_delay_seconds: '1',
    }

    expect(_castForm(input)).toEqual({
      ...input,
      mix_mmFromBottom: 0.5,
      volume: 5,
      times: 2,
      aspirate_delay_seconds: 2,
      dispense_delay_seconds: 1,
    })
  })

  it('should cast pause form fields', () => {
    const input: FormData = {
      id: 'stepId',
      stepType: 'pause',
      stepName: 'pause',
      stepDetails: '',
      pauseAction: 'untilTime',
      pauseHour: '1',
      pauseMinute: '2',
      pauseSecond: '3',
      pauseMessage: 'some message',
      moduleId: 'someModuleId',
      pauseTemperature: null,
      meta: {
        module: {
          id: 'someModuleId',
          type: 'temperatureModuleType',
          model: 'temperatureModuleV2',
        },
      },
    }

    // NOTE: pauseHour + pauseMinute + pauseSecond aren't cast to number
    expect(_castForm(input)).toEqual({
      ...input,
      pauseTemperature: 0,
    })
  })

  it('should cast magnet form fields', () => {
    const input: FormData = {
      id: 'stepId',
      stepType: 'magnet',
      stepName: 'magnet',
      stepDetails: '',
      moduleId: 'someModuleId',
      magnetAction: 'engage',
      engageHeight: '12',
      meta: {
        module: {
          id: 'someModuleId',
          type: 'magneticModuleType',
          model: 'magneticModuleV2',
        },
      },
    }

    expect(_castForm(input)).toEqual({ ...input, engageHeight: 12 })
  })

  it('should cast temperature form fields', () => {
    const input: FormData = {
      id: 'stepId',
      stepType: 'temperature',
      stepName: 'temperature',
      stepDetails: '',
      moduleId: 'someModuleId',
      setTemperature: 'true',
      targetTemperature: '24',
      meta: {
        module: {
          id: 'someModuleId',
          type: 'temperatureModuleType',
          model: 'temperatureModuleV2',
        },
      },
    }
    expect(_castForm(input)).toEqual({
      ...input,
      targetTemperature: 24,
    })
  })

  it('should cast thermocycler form fields', () => {
    const input: FormData = {
      id: 'stepId',
      stepType: 'thermocycler',
      stepName: 'thermocycler',
      stepDetails: '',
      thermocyclerFormType: 'thermocyclerState',
      moduleId: 'someModuleId',
      blockIsActive: true,
      blockTargetTemp: '24',
      lidIsActive: true,
      lidTargetTemp: '44',
      lidOpen: true,
      profileVolume: null,
      profileTargetLidTemp: null,
      orderedProfileItems: [],
      profileItemsById: {},
      blockIsActiveHold: false,
      blockTargetTempHold: null,
      lidIsActiveHold: false,
      lidTargetTempHold: null,
      lidOpenHold: null,
      meta: {
        module: {
          id: 'someModuleId',
          type: 'thermocyclerModuleType',
          model: 'thermocyclerModuleV1',
        },
      },
    }
    expect(_castForm(input)).toEqual({
      ...input,
      blockTargetTemp: 24,
      lidTargetTemp: 44,
      blockTargetTempHold: 0,
      lidTargetTempHold: 0,
    })
  })
})
