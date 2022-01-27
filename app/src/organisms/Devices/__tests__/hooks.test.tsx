import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { Provider } from 'react-redux'
import { createStore, Store } from 'redux'
import { renderHook } from '@testing-library/react-hooks'

import { RUN_STATUS_IDLE, RUN_STATUS_RUNNING } from '@opentrons/api-client'

import { getDiscoverableRobotByName } from '../../../redux/discovery'
import { mockConnectableRobot } from '../../../redux/discovery/__fixtures__'
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
import { useCurrentProtocolRun } from '../../ProtocolUpload/hooks'

import type { UseCurrentProtocolRun } from '../../ProtocolUpload/hooks'
import type { DispatchApiRequestType } from '../../../redux/robot-api'

import {
  useAttachedModules,
  useAttachedPipettes,
  useIsProtocolRunning,
  useLights,
  useRobot,
} from '../hooks'

jest.mock('../../../organisms/ProtocolUpload/hooks')
jest.mock('../../../redux/discovery')
jest.mock('../../../redux/modules')
jest.mock('../../../redux/pipettes')
jest.mock('../../../redux/robot-api')
jest.mock('../../../redux/robot-controls')

const mockFetchLights = fetchLights as jest.MockedFunction<typeof fetchLights>
const mockGetLightsOn = getLightsOn as jest.MockedFunction<typeof getLightsOn>
const mockUpdateLights = updateLights as jest.MockedFunction<
  typeof updateLights
>
const mockUseCurrentProtocolRun = useCurrentProtocolRun as jest.MockedFunction<
  typeof useCurrentProtocolRun
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
const wrapper: React.FunctionComponent<{}> = ({ children }) => (
  <Provider store={store}>{children}</Provider>
)

describe('useAttachedModules hook', () => {
  let dispatchApiRequest: DispatchApiRequestType
  beforeEach(() => {
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
  beforeEach(() => {
    dispatchApiRequest = jest.fn()
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
  beforeEach(() => {
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
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('returns false when current run record does not exist', () => {
    when(mockUseCurrentProtocolRun)
      .calledWith()
      .mockReturnValue({} as UseCurrentProtocolRun)

    const { result } = renderHook(() => useIsProtocolRunning(), { wrapper })

    expect(result.current).toEqual(false)
  })

  it('returns false when current run record is idle', () => {
    when(mockUseCurrentProtocolRun)
      .calledWith()
      .mockReturnValue({
        runRecord: { data: { status: RUN_STATUS_IDLE } },
      } as UseCurrentProtocolRun)

    const { result } = renderHook(() => useIsProtocolRunning(), { wrapper })

    expect(result.current).toEqual(false)
  })

  it('returns true when current run record is not idle', () => {
    when(mockUseCurrentProtocolRun)
      .calledWith()
      .mockReturnValue({
        runRecord: { data: { status: RUN_STATUS_RUNNING } },
      } as UseCurrentProtocolRun)

    const { result } = renderHook(() => useIsProtocolRunning(), {
      wrapper,
    })

    expect(result.current).toEqual(true)
  })
})
