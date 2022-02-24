import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { Provider } from 'react-redux'
import { createStore, Store } from 'redux'
import { renderHook } from '@testing-library/react-hooks'
import { QueryClient, QueryClientProvider } from 'react-query'

import { RUN_STATUS_IDLE, RUN_STATUS_RUNNING } from '@opentrons/api-client'

import {
  fetchCalibrationStatus,
  fetchPipetteOffsetCalibrations,
  fetchTipLengthCalibrations,
  getDeckCalibrationData,
  getPipetteOffsetCalibrations,
  getTipLengthCalibrations,
} from '../../../redux/calibration'
import { mockDeckCalData } from '../../../redux/calibration/__fixtures__'
import {
  mockPipetteOffsetCalibration1,
  mockPipetteOffsetCalibration2,
  mockPipetteOffsetCalibration3,
} from '../../../redux/calibration/pipette-offset/__fixtures__'
import {
  mockTipLengthCalibration1,
  mockTipLengthCalibration2,
  mockTipLengthCalibration3,
} from '../../../redux/calibration/tip-length/__fixtures__'
import { getDiscoverableRobotByName } from '../../../redux/discovery'
import {
  mockConnectableRobot,
  mockReachableRobot,
  mockUnreachableRobot,
} from '../../../redux/discovery/__fixtures__'
import { fetchModules, getAttachedModules } from '../../../redux/modules'
import { fetchPipettes, getAttachedPipettes } from '../../../redux/pipettes'
import { mockFetchModulesSuccessActionPayloadModules } from '../../../redux/modules/__fixtures__'
import {
  mockLeftProtoPipette,
  mockRightProtoPipette,
} from '../../../redux/pipettes/__fixtures__'
import { useDispatchApiRequest } from '../../../redux/robot-api'
import {
  fetchLights,
  updateLights,
  getLightsOn,
} from '../../../redux/robot-controls'
import { useRunStatus } from '../../RunTimeControl/hooks'

import type { DispatchApiRequestType } from '../../../redux/robot-api'

import {
  useAttachedModules,
  useAttachedPipettes,
  useDeckCalibrationData,
  useIsProtocolRunning,
  useIsRobotViewable,
  useLights,
  usePipetteOffsetCalibrations,
  useRobot,
  useTipLengthCalibrations,
} from '../hooks'

jest.mock('../../../organisms/RunTimeControl/hooks')
jest.mock('../../../redux/calibration')
jest.mock('../../../redux/discovery')
jest.mock('../../../redux/modules')
jest.mock('../../../redux/pipettes')
jest.mock('../../../redux/robot-api')
jest.mock('../../../redux/robot-controls')

const mockFetchCalibrationStatus = fetchCalibrationStatus as jest.MockedFunction<
  typeof fetchCalibrationStatus
>
const mockFetchPipetteOffsetCalibrations = fetchPipetteOffsetCalibrations as jest.MockedFunction<
  typeof fetchPipetteOffsetCalibrations
>
const mockFetchTipLengthCalibrations = fetchTipLengthCalibrations as jest.MockedFunction<
  typeof fetchTipLengthCalibrations
>
const mockGetDeckCalibrationData = getDeckCalibrationData as jest.MockedFunction<
  typeof getDeckCalibrationData
>
const mockGetPipetteOffsetCalibrations = getPipetteOffsetCalibrations as jest.MockedFunction<
  typeof getPipetteOffsetCalibrations
>
const mockGetTipLengthCalibrations = getTipLengthCalibrations as jest.MockedFunction<
  typeof getTipLengthCalibrations
>
const mockFetchLights = fetchLights as jest.MockedFunction<typeof fetchLights>
const mockGetLightsOn = getLightsOn as jest.MockedFunction<typeof getLightsOn>
const mockUpdateLights = updateLights as jest.MockedFunction<
  typeof updateLights
>
const mockUseRunStatus = useRunStatus as jest.MockedFunction<
  typeof useRunStatus
>
const mockGetDiscoverableRobotByName = getDiscoverableRobotByName as jest.MockedFunction<
  typeof getDiscoverableRobotByName
>
const mockFetchModules = fetchModules as jest.MockedFunction<
  typeof fetchModules
>
const mockFetchPipettes = fetchPipettes as jest.MockedFunction<
  typeof fetchPipettes
>
const mockGetAttachedModules = getAttachedModules as jest.MockedFunction<
  typeof getAttachedModules
>
const mockGetAttachedPipettes = getAttachedPipettes as jest.MockedFunction<
  typeof getAttachedPipettes
>
const mockUseDispatchApiRequest = useDispatchApiRequest as jest.MockedFunction<
  typeof useDispatchApiRequest
>

const store: Store<any> = createStore(jest.fn(), {})

describe('useAttachedModules hook', () => {
  let dispatchApiRequest: DispatchApiRequestType
  let wrapper: React.FunctionComponent<{}>
  beforeEach(() => {
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Provider>
    )
    dispatchApiRequest = jest.fn()
    mockUseDispatchApiRequest.mockReturnValue([dispatchApiRequest, []])
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('returns no modules when given a null robot name', () => {
    when(mockGetAttachedModules)
      .calledWith(undefined as any, null)
      .mockReturnValue([])

    const { result } = renderHook(() => useAttachedModules(null), { wrapper })

    expect(result.current).toEqual([])
    expect(dispatchApiRequest).not.toBeCalled()
  })

  it('returns attached modules when given a robot name', () => {
    when(mockGetAttachedModules)
      .calledWith(undefined as any, 'otie')
      .mockReturnValue(mockFetchModulesSuccessActionPayloadModules)

    const { result } = renderHook(() => useAttachedModules('otie'), { wrapper })

    expect(result.current).toEqual(mockFetchModulesSuccessActionPayloadModules)
    expect(dispatchApiRequest).toBeCalledWith(mockFetchModules('otie'))
  })
})

describe('useAttachedPipettes hook', () => {
  let dispatchApiRequest: DispatchApiRequestType
  let wrapper: React.FunctionComponent<{}>
  beforeEach(() => {
    dispatchApiRequest = jest.fn()
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Provider>
    )
    mockUseDispatchApiRequest.mockReturnValue([dispatchApiRequest, []])
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('returns no pipettes when given a null robot name', () => {
    when(mockGetAttachedPipettes)
      .calledWith(undefined as any, null)
      .mockReturnValue({ left: null, right: null })

    const { result } = renderHook(() => useAttachedPipettes(null), { wrapper })

    expect(result.current).toEqual({ left: null, right: null })
    expect(dispatchApiRequest).not.toBeCalled()
  })

  it('returns attached pipettes when given a robot name', () => {
    when(mockGetAttachedPipettes)
      .calledWith(undefined as any, 'otie')
      .mockReturnValue({
        left: mockLeftProtoPipette,
        right: mockRightProtoPipette,
      })

    const { result } = renderHook(() => useAttachedPipettes('otie'), {
      wrapper,
    })

    expect(result.current).toEqual({
      left: mockLeftProtoPipette,
      right: mockRightProtoPipette,
    })
    expect(dispatchApiRequest).toBeCalledWith(mockFetchPipettes('otie'))
  })
})

describe('useRobot hook', () => {
  let wrapper: React.FunctionComponent<{}>
  beforeEach(() => {
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Provider>
    )
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('returns null when given a robot name that is not discoverable', () => {
    when(mockGetDiscoverableRobotByName)
      .calledWith(undefined as any, 'otie')
      .mockReturnValue(null)

    const { result } = renderHook(() => useRobot('otie'), { wrapper })

    expect(result.current).toEqual(null)
  })

  it('returns robot when given a discoverable robot name', () => {
    when(mockGetDiscoverableRobotByName)
      .calledWith(undefined as any, 'otie')
      .mockReturnValue(mockConnectableRobot)

    const { result } = renderHook(() => useRobot('otie'), {
      wrapper,
    })

    expect(result.current).toEqual(mockConnectableRobot)
  })
})

describe('useLights hook', () => {
  let dispatchApiRequest: DispatchApiRequestType

  let wrapper: React.FunctionComponent<{}>
  beforeEach(() => {
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Provider>
    )
    dispatchApiRequest = jest.fn()
    mockUseDispatchApiRequest.mockReturnValue([dispatchApiRequest, []])
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('toggles lights off when on', () => {
    when(mockGetLightsOn)
      .calledWith(undefined as any, 'otie')
      .mockReturnValue(true)

    const { result } = renderHook(() => useLights('otie'), { wrapper })

    expect(dispatchApiRequest).toBeCalledWith(mockFetchLights('otie'))
    expect(result.current.lightsOn).toEqual(true)
    result.current.toggleLights()
    expect(dispatchApiRequest).toBeCalledWith(mockUpdateLights('otie', false))
  })

  it('toggles lights on when off', () => {
    when(mockGetLightsOn)
      .calledWith(undefined as any, 'otie')
      .mockReturnValue(false)

    const { result } = renderHook(() => useLights('otie'), {
      wrapper,
    })

    expect(dispatchApiRequest).toBeCalledWith(mockFetchLights('otie'))
    expect(result.current.lightsOn).toEqual(false)
    result.current.toggleLights()
    expect(dispatchApiRequest).toBeCalledWith(mockUpdateLights('otie', true))
  })
})

describe('useIsProtocolRunning hook', () => {
  let wrapper: React.FunctionComponent<{}>
  beforeEach(() => {
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Provider>
    )
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('returns false when current run record does not exist', () => {
    when(mockUseRunStatus).calledWith().mockReturnValue(null)

    const { result } = renderHook(() => useIsProtocolRunning(), { wrapper })

    expect(result.current).toEqual(false)
  })

  it('returns false when current run record is idle', () => {
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_IDLE)

    const { result } = renderHook(() => useIsProtocolRunning(), { wrapper })

    expect(result.current).toEqual(false)
  })

  it('returns true when current run record is not idle', () => {
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_RUNNING)

    const { result } = renderHook(() => useIsProtocolRunning(), {
      wrapper,
    })

    expect(result.current).toEqual(true)
  })
})

describe('useIsRobotViewable hook', () => {
  let wrapper: React.FunctionComponent<{}>
  beforeEach(() => {
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Provider>
    )
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('returns false when given an unreachable robot name', () => {
    when(mockGetDiscoverableRobotByName)
      .calledWith(undefined as any, 'otie')
      .mockReturnValue(mockUnreachableRobot)

    const { result } = renderHook(() => useIsRobotViewable('otie'), { wrapper })

    expect(result.current).toEqual(false)
  })

  it('returns true when given a reachable robot name', () => {
    when(mockGetDiscoverableRobotByName)
      .calledWith(undefined as any, 'otie')
      .mockReturnValue(mockReachableRobot)

    const { result } = renderHook(() => useIsRobotViewable('otie'), {
      wrapper,
    })

    expect(result.current).toEqual(true)
  })

  it('returns true when given a connectable robot name', () => {
    when(mockGetDiscoverableRobotByName)
      .calledWith(undefined as any, 'otie')
      .mockReturnValue(mockConnectableRobot)

    const { result } = renderHook(() => useIsRobotViewable('otie'), {
      wrapper,
    })

    expect(result.current).toEqual(true)
  })
})

describe('useDeckCalibrationData hook', () => {
  let dispatchApiRequest: DispatchApiRequestType
  let wrapper: React.FunctionComponent<{}>
  beforeEach(() => {
    dispatchApiRequest = jest.fn()
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Provider>
    )
    mockUseDispatchApiRequest.mockReturnValue([dispatchApiRequest, []])
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('returns no deck calibration data when given a null robot name', () => {
    when(mockGetDeckCalibrationData)
      .calledWith(undefined as any, null)
      .mockReturnValue(null)

    const { result } = renderHook(() => useDeckCalibrationData(null), {
      wrapper,
    })

    expect(result.current).toEqual(null)
    expect(dispatchApiRequest).not.toBeCalled()
  })

  it('returns deck calibration data when given a robot name', () => {
    when(mockGetDeckCalibrationData)
      .calledWith(undefined as any, 'otie')
      .mockReturnValue(mockDeckCalData)

    const { result } = renderHook(() => useDeckCalibrationData('otie'), {
      wrapper,
    })

    expect(result.current).toEqual(mockDeckCalData)
    expect(dispatchApiRequest).toBeCalledWith(
      mockFetchCalibrationStatus('otie')
    )
  })
})

describe('usePipetteOffsetCalibrations hook', () => {
  let dispatchApiRequest: DispatchApiRequestType
  let wrapper: React.FunctionComponent<{}>
  beforeEach(() => {
    dispatchApiRequest = jest.fn()
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Provider>
    )
    mockUseDispatchApiRequest.mockReturnValue([dispatchApiRequest, []])
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('returns no pipette offset calibrations when given a null robot name', () => {
    when(mockGetPipetteOffsetCalibrations)
      .calledWith(undefined as any, null)
      .mockReturnValue([])

    const { result } = renderHook(() => usePipetteOffsetCalibrations(null), {
      wrapper,
    })

    expect(result.current).toEqual([])
    expect(dispatchApiRequest).not.toBeCalled()
  })

  it('returns pipette offset calibrations when given a robot name', () => {
    when(mockGetPipetteOffsetCalibrations)
      .calledWith(undefined as any, 'otie')
      .mockReturnValue([
        mockPipetteOffsetCalibration1,
        mockPipetteOffsetCalibration2,
        mockPipetteOffsetCalibration3,
      ])

    const { result } = renderHook(() => usePipetteOffsetCalibrations('otie'), {
      wrapper,
    })

    expect(result.current).toEqual([
      mockPipetteOffsetCalibration1,
      mockPipetteOffsetCalibration2,
      mockPipetteOffsetCalibration3,
    ])
    expect(dispatchApiRequest).toBeCalledWith(
      mockFetchPipetteOffsetCalibrations('otie')
    )
  })
})

describe('useTipLengthCalibrations hook', () => {
  let dispatchApiRequest: DispatchApiRequestType
  let wrapper: React.FunctionComponent<{}>
  beforeEach(() => {
    dispatchApiRequest = jest.fn()
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Provider>
    )
    mockUseDispatchApiRequest.mockReturnValue([dispatchApiRequest, []])
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('returns no tip length calibrations when given a null robot name', () => {
    when(mockGetTipLengthCalibrations)
      .calledWith(undefined as any, null)
      .mockReturnValue([])

    const { result } = renderHook(() => useTipLengthCalibrations(null), {
      wrapper,
    })

    expect(result.current).toEqual([])
    expect(dispatchApiRequest).not.toBeCalled()
  })

  it('returns tip length calibrations when given a robot name', () => {
    when(mockGetTipLengthCalibrations)
      .calledWith(undefined as any, 'otie')
      .mockReturnValue([
        mockTipLengthCalibration1,
        mockTipLengthCalibration2,
        mockTipLengthCalibration3,
      ])

    const { result } = renderHook(() => useTipLengthCalibrations('otie'), {
      wrapper,
    })

    expect(result.current).toEqual([
      mockTipLengthCalibration1,
      mockTipLengthCalibration2,
      mockTipLengthCalibration3,
    ])
    expect(dispatchApiRequest).toBeCalledWith(
      mockFetchTipLengthCalibrations('otie')
    )
  })
})
