import { useDispatch } from 'react-redux'
import { renderHook } from '@testing-library/react'
import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest'

import { useHost } from '@opentrons/react-api-client'

import { useNotifyService } from '../useNotifyService'
import { appShellListener } from '../../redux/shell/remote'
import { useTrackEvent } from '../../redux/analytics'
import { notifySubscribeAction } from '../../redux/shell'
import { useIsFlex } from '../../organisms/Devices/hooks/useIsFlex'

import type { Mock } from 'vitest'
import type { HostConfig } from '@opentrons/api-client'
import type { QueryOptionsWithPolling } from '../useNotifyService'

vi.mock('react-redux')
vi.mock('@opentrons/react-api-client')
vi.mock('../../redux/analytics')
vi.mock('../../redux/shell/remote', () => ({
  appShellListener: vi.fn(),
}))
vi.mock('../../organisms/Devices/hooks/useIsFlex')

const MOCK_HOST_CONFIG: HostConfig = { hostname: 'MOCK_HOST' }
const MOCK_TOPIC = '/test/topic' as any
const MOCK_OPTIONS: QueryOptionsWithPolling<any, any> = {
  forceHttpPolling: false,
}

describe('useNotifyService', () => {
  let mockDispatch: Mock
  let mockTrackEvent: Mock
  let mockHTTPRefetch: Mock

  beforeEach(() => {
    mockDispatch = vi.fn()
    mockHTTPRefetch = vi.fn()
    mockTrackEvent = vi.fn()
    vi.mocked(useTrackEvent).mockReturnValue(mockTrackEvent)
    vi.mocked(useDispatch).mockReturnValue(mockDispatch)
    vi.mocked(useHost).mockReturnValue(MOCK_HOST_CONFIG)
    vi.mocked(useIsFlex).mockReturnValue(true)
    vi.mocked(appShellListener).mockClear()
  })

  afterEach(() => {
    vi.mocked(useDispatch).mockClear()
    vi.clearAllMocks()
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
    expect(appShellListener).toHaveBeenCalled()
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
    expect(appShellListener).not.toHaveBeenCalled()
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
    expect(appShellListener).not.toHaveBeenCalled()
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
    expect(appShellListener).not.toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should set HTTP refetch to always if there is an error', () => {
    vi.mocked(useHost).mockReturnValue({ hostname: null } as any)
    const errorSpy = vi.spyOn(console, 'error')
    errorSpy.mockImplementation(() => {})

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
    vi.mocked(appShellListener).mockImplementation(function ({
      callback,
    }): any {
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
    vi.mocked(appShellListener).mockImplementation(function ({
      callback,
    }): any {
      // eslint-disable-next-line n/no-callback-literal
      callback({ refetchUsingHTTP: true })
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

  it('should trigger a single HTTP refetch if the unsubscribe flag was returned', () => {
    vi.mocked(appShellListener).mockImplementation(function ({
      callback,
    }): any {
      // eslint-disable-next-line n/no-callback-literal
      callback({ unsubscribe: true })
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
    expect(appShellListener).toHaveBeenCalled()
  })
})
