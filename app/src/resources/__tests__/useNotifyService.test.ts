import { useDispatch } from 'react-redux'
import { renderHook } from '@testing-library/react'

import { useHost } from '@opentrons/react-api-client'

import { useNotifyService } from '../useNotifyService'
import { appShellListener } from '../../redux/shell/remote'
import { useTrackEvent } from '../../redux/analytics'
import {
  notifySubscribeAction,
  notifyUnsubscribeAction,
} from '../../redux/shell'
import { useIsFlex } from '../../organisms/Devices/hooks/useIsFlex'

import type { HostConfig } from '@opentrons/api-client'
import type { QueryOptionsWithPolling } from '../useNotifyService'

jest.mock('react-redux')
jest.mock('@opentrons/react-api-client')
jest.mock('../../redux/analytics')
jest.mock('../../redux/shell/remote', () => ({
  appShellListener: jest.fn(),
}))
jest.mock('../../organisms/Devices/hooks/useIsFlex')

const MOCK_HOST_CONFIG: HostConfig = { hostname: 'MOCK_HOST' }
const MOCK_TOPIC = '/test/topic' as any
const MOCK_OPTIONS: QueryOptionsWithPolling<any, any> = {
  forceHttpPolling: false,
}

const mockUseHost = useHost as jest.MockedFunction<typeof useHost>
const mockUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>
const mockUseTrackEvent = useTrackEvent as jest.MockedFunction<
  typeof useTrackEvent
>
const mockAppShellListener = appShellListener as jest.MockedFunction<
  typeof appShellListener
>
const mockUseIsFlex = useIsFlex as jest.MockedFunction<typeof useIsFlex>

describe('useNotifyService', () => {
  let mockDispatch: jest.Mock
  let mockTrackEvent: jest.Mock
  let mockHTTPRefetch: jest.Mock

  beforeEach(() => {
    mockDispatch = jest.fn()
    mockHTTPRefetch = jest.fn()
    mockTrackEvent = jest.fn()
    mockUseTrackEvent.mockReturnValue(mockTrackEvent)
    mockUseDispatch.mockReturnValue(mockDispatch)
    mockUseHost.mockReturnValue(MOCK_HOST_CONFIG)
    mockUseIsFlex.mockReturnValue(true)
  })

  afterEach(() => {
    mockUseDispatch.mockClear()
    jest.clearAllMocks()
  })

  it('should trigger an HTTP refetch and subscribe action on a successful initial mount', () => {
    renderHook(() =>
      useNotifyService({
        topic: MOCK_TOPIC,
        setRefetchUsingHTTP: mockHTTPRefetch,
        options: MOCK_OPTIONS,
      } as any)
    )
    expect(mockHTTPRefetch).toHaveBeenCalledWith('once')
    expect(mockDispatch).toHaveBeenCalledWith(
      notifySubscribeAction(MOCK_HOST_CONFIG.hostname, MOCK_TOPIC)
    )
    expect(mockDispatch).not.toHaveBeenCalledWith(
      notifyUnsubscribeAction(MOCK_HOST_CONFIG.hostname, MOCK_TOPIC)
    )
    expect(mockAppShellListener).toHaveBeenCalled()
  })

  it('should trigger an unsubscribe action on dismount', () => {
    const { unmount } = renderHook(() =>
      useNotifyService({
        topic: MOCK_TOPIC,
        setRefetchUsingHTTP: mockHTTPRefetch,
        options: MOCK_OPTIONS,
      } as any)
    )
    unmount()
    expect(mockDispatch).toHaveBeenCalledWith(
      notifyUnsubscribeAction(MOCK_HOST_CONFIG.hostname, MOCK_TOPIC)
    )
  })

  it('should not subscribe to notifications if forceHttpPolling is true', () => {
    renderHook(() =>
      useNotifyService({
        topic: MOCK_TOPIC,
        setRefetchUsingHTTP: mockHTTPRefetch,
        options: { ...MOCK_OPTIONS, forceHttpPolling: true },
      } as any)
    )
    expect(mockHTTPRefetch).toHaveBeenCalled()
    expect(mockAppShellListener).not.toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should not subscribe to notifications if enabled is false', () => {
    renderHook(() =>
      useNotifyService({
        topic: MOCK_TOPIC,
        setRefetchUsingHTTP: mockHTTPRefetch,
        options: { ...MOCK_OPTIONS, enabled: false },
      } as any)
    )
    expect(mockHTTPRefetch).toHaveBeenCalled()
    expect(mockAppShellListener).not.toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should not subscribe to notifications if staleTime is Infinity', () => {
    renderHook(() =>
      useNotifyService({
        topic: MOCK_TOPIC,
        setRefetchUsingHTTP: mockHTTPRefetch,
        options: { ...MOCK_OPTIONS, staleTime: Infinity },
      } as any)
    )
    expect(mockHTTPRefetch).toHaveBeenCalled()
    expect(mockAppShellListener).not.toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should set HTTP refetch to always if there is an error', () => {
    mockUseHost.mockReturnValue({ hostname: null } as any)

    renderHook(() =>
      useNotifyService({
        topic: MOCK_TOPIC,
        setRefetchUsingHTTP: mockHTTPRefetch,
        options: MOCK_OPTIONS,
      } as any)
    )
    expect(mockHTTPRefetch).toHaveBeenCalledWith('always')
  })

  it('should return set HTTP refetch to always and fire an analytics reporting event if the connection was refused', () => {
    mockAppShellListener.mockImplementation(function ({ callback }): any {
      // eslint-disable-next-line n/no-callback-literal
      callback('ECONNREFUSED')
    })
    const { rerender } = renderHook(() =>
      useNotifyService({
        topic: MOCK_TOPIC,
        setRefetchUsingHTTP: mockHTTPRefetch,
        options: MOCK_OPTIONS,
      } as any)
    )
    expect(mockTrackEvent).toHaveBeenCalled()
    rerender()
    expect(mockHTTPRefetch).toHaveBeenCalledWith('always')
  })

  it('should trigger a single HTTP refetch if the refetch flag was returned', () => {
    mockAppShellListener.mockImplementation(function ({ callback }): any {
      // eslint-disable-next-line n/no-callback-literal
      callback('ECONNREFUSED')
    })
    const { rerender } = renderHook(() =>
      useNotifyService({
        topic: MOCK_TOPIC,
        setRefetchUsingHTTP: mockHTTPRefetch,
        options: MOCK_OPTIONS,
      } as any)
    )
    rerender()
    expect(mockHTTPRefetch).toHaveBeenCalledWith('once')
  })

  it('should clean up the listener on dismount', () => {
    const { unmount } = renderHook(() =>
      useNotifyService({
        topic: MOCK_TOPIC,
        setRefetchUsingHTTP: mockHTTPRefetch,
        options: MOCK_OPTIONS,
      })
    )
    unmount()
    expect(mockAppShellListener).toHaveBeenCalled()
  })
})
