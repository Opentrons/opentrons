import * as React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook } from '@testing-library/react-hooks'
import { when, resetAllWhenMocks } from 'jest-when'

import {
  useIsFlex,
  useModuleCalibrationStatus,
  useModuleRenderInfoForProtocolById,
} from '..'

import { mockMagneticModuleGen2 } from '../../../../redux/modules/__fixtures__'

import type { ModuleModel, ModuleType } from '@opentrons/shared-data'

import { Provider } from 'react-redux'
import { createStore } from 'redux'

jest.mock('../useIsFlex')
jest.mock('../useModuleRenderInfoForProtocolById')

const mockUseIsFlex = useIsFlex as jest.MockedFunction<typeof useIsFlex>
const mockUseModuleRenderInfoForProtocolById = useModuleRenderInfoForProtocolById as jest.MockedFunction<
  typeof useModuleRenderInfoForProtocolById
>
let wrapper: React.FunctionComponent<{}>

const mockMagneticModuleDefinition = {
  moduleId: 'someMagneticModule',
  model: 'magneticModuleV2' as ModuleModel,
  type: 'magneticModuleType' as ModuleType,
  labwareOffset: { x: 5, y: 5, z: 5 },
  cornerOffsetFromSlot: { x: 1, y: 1, z: 1 },
  dimensions: {
    xDimension: 100,
    yDimension: 100,
    footprintXDimension: 50,
    footprintYDimension: 50,
    labwareInterfaceXDimension: 80,
    labwareInterfaceYDimension: 120,
  },
  twoDimensionalRendering: { children: [] },
}

const MAGNETIC_MODULE_INFO = {
  moduleId: 'magneticModuleId',
  x: 0,
  y: 0,
  z: 0,
  moduleDef: mockMagneticModuleDefinition as any,
  nestedLabwareDef: null,
  nestedLabwareId: null,
  nestedLabwareDisplayName: null,
  protocolLoadOrder: 0,
  slotName: '1',
}

const mockOffsetData = {
  offset: {
    x: 0.2578125,
    y: -0.3515625,
    z: -0.7515000000000001,
  },
  slot: 'D1',
  last_modified: '2023-10-11T14:11:14.061780+00:00',
}

describe('useModuleCalibrationStatus hook', () => {
  beforeEach(() => {
    const queryClient = new QueryClient()
    const store = createStore(jest.fn(), {})
    store.dispatch = jest.fn()
    store.getState = jest.fn(() => {})

    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>{children}</Provider>
      </QueryClientProvider>
    )
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('should return calibration complete if OT-2', () => {
    when(mockUseIsFlex).calledWith('otie').mockReturnValue(false)
    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith('1')
      .mockReturnValue({})

    const { result } = renderHook(
      () => useModuleCalibrationStatus('otie', '1'),
      { wrapper }
    )

    expect(result.current).toEqual({ complete: true })
  })

  it('should return calibration complete if no modules needed', () => {
    when(mockUseIsFlex).calledWith('otie').mockReturnValue(true)
    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith('1')
      .mockReturnValue({})

    const { result } = renderHook(
      () => useModuleCalibrationStatus('otie', '1'),
      { wrapper }
    )

    expect(result.current).toEqual({ complete: true })
  })

  it('should return calibration complete if offset date exists', () => {
    when(mockUseIsFlex).calledWith('otie').mockReturnValue(true)
    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith('1')
      .mockReturnValue({
        magneticModuleId: {
          attachedModuleMatch: {
            ...mockMagneticModuleGen2,
            moduleOffset: mockOffsetData,
          },
          ...MAGNETIC_MODULE_INFO,
        },
      })

    const { result } = renderHook(
      () => useModuleCalibrationStatus('otie', '1'),
      { wrapper }
    )

    expect(result.current).toEqual({ complete: true })
  })

  it('should return calibration needed if offset date does not exist', () => {
    when(mockUseIsFlex).calledWith('otie').mockReturnValue(true)
    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith('1')
      .mockReturnValue({
        magneticModuleId: {
          attachedModuleMatch: {
            ...mockMagneticModuleGen2,
          },
          ...MAGNETIC_MODULE_INFO,
        },
      })

    const { result } = renderHook(
      () => useModuleCalibrationStatus('otie', '1'),
      { wrapper }
    )

    expect(result.current).toEqual({
      complete: false,
      reason: 'calibrate_module_failure_reason',
    })
  })
})
