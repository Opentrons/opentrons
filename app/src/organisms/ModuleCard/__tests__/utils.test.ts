import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import {
  mockHeaterShaker,
  mockMagneticModule,
  mockMagneticModuleGen2,
  mockTemperatureModule,
  mockTemperatureModuleGen2,
  mockThermocycler,
  mockThermocyclerGen2,
} from '/app/redux/modules/__fixtures__'
import { getModuleCardImage, useModuleApiRequests } from '../utils'
import { useDispatchApiRequest } from '/app/redux/robot-api'

vi.mock('/app/redux/robot-api')

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
})

const updateModuleAction = { meta: { requestId: '12345' } }
const MOCK_ROBOT_NAME = 'MOCK_ROBOT'
const MOCK_SERIAL_NUMBER = '1234'
const mockDispatchApiRequest = () => updateModuleAction

describe('useModuleApiRequests', () => {
  beforeEach(() => {
    vi.mocked(useDispatchApiRequest).mockReturnValue([
      mockDispatchApiRequest,
    ] as any)
  })

  it('should dispatch an API request and update requestIdsBySerial on handleModuleApiRequests', () => {
    const { result } = renderHook(() => useModuleApiRequests())

    act(() => {
      result.current[1](MOCK_ROBOT_NAME, MOCK_SERIAL_NUMBER)
    })

    expect(result.current[0](MOCK_SERIAL_NUMBER)).toEqual(
      updateModuleAction.meta.requestId
    )
    expect(result.current[0]('NON_EXISTENT_SERIAL')).toBeNull()
  })
})
