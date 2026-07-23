import { describe, expect, it } from 'vitest'

import {
  mockHeaterShaker,
  mockMagneticModule,
  mockMagneticModuleGen2,
  mockTemperatureModule,
  mockTemperatureModuleGen2,
  mockThermocycler,
  mockThermocyclerGen2,
} from '/app/redux/modules/__fixtures__'

import { getModuleCardImage, getPumpStatusProps } from '../utils'

const mockThermocyclerGen2ClosedLid = {
  id: 'thermocycler_id2',
  moduleModel: 'thermocyclerModuleV2',
  moduleType: 'thermocyclerModuleType',
  data: {
    lidStatus: 'closed',
  },
} as any

const mockThermocyclerGen1ClosedLid = {
  id: 'thermocycler_id',
  moduleModel: 'thermocyclerModuleV1',
  moduleType: 'thermocyclerModuleType',
  data: {
    lidStatus: 'closed',
  },
} as any

const mockFlexStacker = {
  id: 'flex_stacker_id',
  serialNumber: 'fs123',
  hardwareRevision: 'flex_stacker_v1.0',
  moduleModel: 'flexStackerModuleV1',
  moduleType: 'flexStackerModuleType',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: false,
  usbPort: {
    path: '/dev/ot_module_flex_stacker',
    hub: false,
    port: 1,
    portGroup: 'unknown',
  },
  data: {
    platformState: 'extended',
    hopperDoorState: 'closed',
    status: 'idle',
  },
} as any

describe('getModuleCardImage', () => {
  it('should render the correct image string when there is a magnetic module gen 2 attached', () => {
    const result = getModuleCardImage(mockMagneticModuleGen2)
    expect(result).toEqual(
      '/app/src/assets/images/magnetic_module_gen_2_transparent.png'
    )
  })
  it('should render the correct image string when there is a magnetic module gen 1 attached', () => {
    const result = getModuleCardImage(mockMagneticModule)
    expect(result).toEqual(
      '/app/src/assets/images/magnetic_module_gen_2_transparent.png'
    )
  })
  it('should render the correct image string when there is a temperature module gen 1 attached', () => {
    const result = getModuleCardImage(mockTemperatureModule)
    expect(result).toEqual(
      '/app/src/assets/images/temp_deck_gen_2_transparent.png'
    )
  })
  it('should render the correct image string when there is a temperature module gen 2 attached', () => {
    const result = getModuleCardImage(mockTemperatureModuleGen2)
    expect(result).toEqual(
      '/app/src/assets/images/temp_deck_gen_2_transparent.png'
    )
  })
  it('should render the correct image string when there is a heater shaker gen 1 attached', () => {
    const result = getModuleCardImage(mockHeaterShaker)
    expect(result).toEqual(
      '/app/src/assets/images/heater_shaker_module_transparent.png'
    )
  })
  it('should render the correct image string when there is a thermocycler gen 1 attached with opened lid', () => {
    const result = getModuleCardImage(mockThermocycler)
    expect(result).toEqual(
      '/app/src/assets/images/thermocycler_open_transparent.png'
    )
  })
  it('should render the correct image string when there is a thermocycler gen 1 attached with closed lid', () => {
    const result = getModuleCardImage(mockThermocyclerGen1ClosedLid)
    expect(result).toEqual('/app/src/assets/images/thermocycler_closed.png')
  })
  it('should render the correct image string when there is a thermocycler gen 2 with opened lid is attached', () => {
    const result = getModuleCardImage(mockThermocyclerGen2)
    expect(result).toEqual(
      '/app/src/assets/images/thermocycler_gen_2_opened.png'
    )
  })
  it('should render the correct image string when there is a thermocycler gen 2 with closed lid is attached', () => {
    const result = getModuleCardImage(mockThermocyclerGen2ClosedLid)
    expect(result).toEqual(
      '/app/src/assets/images/thermocycler_gen_2_closed.png'
    )
  })
  it('should render the correct image string when there is a flex stacker is attached', () => {
    const result = getModuleCardImage(mockFlexStacker)
    expect(result).toEqual('/app/src/assets/images/flex_stacker_no_labware.png')
  })
})

describe('getPumpStatusProps', () => {
  const mockT = (key: string): string => {
    const translations: Record<string, string> = {
      pump_idle: 'Idle',
      pump_engaged: 'Engaged',
      pump_error: 'Error',
    }
    return translations[key] ?? key
  }

  it.each<[string, { text: string; type: string }]>([
    ['idle', { text: 'Idle', type: 'neutral' }],
    ['ramping', { text: 'Engaged', type: 'info' }],
    ['holding', { text: 'Engaged', type: 'info' }],
    ['venting', { text: 'Engaged', type: 'info' }],
    ['complete', { text: 'Engaged', type: 'info' }],
    ['error', { text: 'Error', type: 'error' }],
  ])(
    'should return the correct props for the pump status',
    (status, expected) => {
      const result = getPumpStatusProps(mockT, status as any)
      expect(result).toEqual(expected)
    }
  )
})
