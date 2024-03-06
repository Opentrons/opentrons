import { useDispatch } from 'react-redux'
import { renderHook } from '@testing-library/react'
import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest'

import { useHost } from '@opentrons/react-api-client'

import { useNotifyService } from '../useNotifyService'
import { appShellListener } from '../../redux/shell/remote'
import { useTrackEvent } from '../../redux/analytics'
import {
  notifySubscribeAction,
  notifyUnsubscribeAction,
} from '../../redux/shell'

import type { Mock } from 'vitest'
import type { HostConfig } from '@opentrons/api-client'
import type { QueryOptionsWithPolling } from '../useNotifyService'

vi.mock('react-redux')
vi.mock('@opentrons/react-api-client')
vi.mock('../../redux/analytics')
vi.mock('../../redux/shell/remote', () => ({
  appShellListener: vi.fn(),
}))

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
  })

  afterEach(() => {
    vi.mocked(useDispatch).mockClear()
    vi.clearAllMocks()
  })

  it('should trigger an HTTP refetch and subscribe action on initial mount', () => {
    renderHook(() =>
      useNotifyService({
        topic: MOCK_TOPIC,
        refetchUsingHTTP: mockHTTPRefetch,
        options: MOCK_OPTIONS,
      } as any)
    )
    expect(mockHTTPRefetch).toHaveBeenCalled()
    expect(mockDispatch).toHaveBeenCalledWith(
      notifySubscribeAction(MOCK_HOST_CONFIG.hostname, MOCK_TOPIC)
    )
    expect(mockDispatch).not.toHaveBeenCalledWith(
      notifyUnsubscribeAction(MOCK_HOST_CONFIG.hostname, MOCK_TOPIC)
    )
    expect(appShellListener).toHaveBeenCalled()
  })

  it('should trigger an unsubscribe action on dismount', () => {
    const { unmount } = renderHook(() =>
      useNotifyService({
        topic: MOCK_TOPIC,
        refetchUsingHTTP: mockHTTPRefetch,
        options: MOCK_OPTIONS,
      } as any)
    )
    unmount()
    expect(mockDispatch).toHaveBeenCalledWith(
      notifyUnsubscribeAction(MOCK_HOST_CONFIG.hostname, MOCK_TOPIC)
    )
  })

  it('should return no notify error if there was a successful topic subscription', () => {
    const { result } = renderHook(() =>
      useNotifyService({
        topic: MOCK_TOPIC,
        refetchUsingHTTP: mockHTTPRefetch,
        options: MOCK_OPTIONS,
      } as any)
    )
    expect(result.current.isNotifyError).toBe(false)
  })

  it('should not subscribe to notifications if forceHttpPolling is true', () => {
    renderHook(() =>
      useNotifyService({
        topic: MOCK_TOPIC,
        refetchUsingHTTP: mockHTTPRefetch,
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
        refetchUsingHTTP: mockHTTPRefetch,
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
        refetchUsingHTTP: mockHTTPRefetch,
        options: { ...MOCK_OPTIONS, staleTime: Infinity },
      } as any)
    )
    expect(mockHTTPRefetch).toHaveBeenCalled()
    expect(appShellListener).not.toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should log an error if hostname is null', () => {
    vi.mocked(useHost).mockReturnValue({ hostname: null } as any)
    const errorSpy = vi.spyOn(console, 'error')
    errorSpy.mockImplementation(() => {})

    renderHook(() =>
      useNotifyService({
        topic: MOCK_TOPIC,
        refetchUsingHTTP: mockHTTPRefetch,
        options: MOCK_OPTIONS,
      } as any)
    )
    expect(errorSpy).toHaveBeenCalledWith(
      'NotifyService expected hostname, received null for topic:',
      MOCK_TOPIC
    )
    errorSpy.mockRestore()
  })

  it('should return a notify error and fire an analytics reporting event if the connection was refused', () => {
    vi.mocked(appShellListener).mockImplementation(
      (_: any, __: any, mockCb: any) => {
        mockCb('ECONNREFUSED')
      }
    )
    const { result, rerender } = renderHook(() =>
      useNotifyService({
        topic: MOCK_TOPIC,
        refetchUsingHTTP: mockHTTPRefetch,
        options: MOCK_OPTIONS,
      } as any)
    )
    expect(mockTrackEvent).toHaveBeenCalled()
    rerender()
    expect(result.current.isNotifyError).toBe(true)
  })

  it('should return a notify error if the connection failed', () => {
    vi.mocked(appShellListener).mockImplementation(
      (_: any, __: any, mockCb: any) => {
        mockCb('ECONNFAILED')
      }
    )
    const { result, rerender } = renderHook(() =>
      useNotifyService({
        topic: MOCK_TOPIC,
        refetchUsingHTTP: mockHTTPRefetch,
        options: MOCK_OPTIONS,
      } as any)
    )
    rerender()
    expect(result.current.isNotifyError).toBe(true)
  })

  it('should trigger an HTTP refetch if the refetch flag was returned', () => {
    vi.mocked(appShellListener).mockImplementation(
      (_: any, __: any, mockCb: any) => {
        mockCb({ refetchUsingHTTP: true })
      }
    )
    const { rerender } = renderHook(() =>
      useNotifyService({
        topic: MOCK_TOPIC,
        refetchUsingHTTP: mockHTTPRefetch,
        options: MOCK_OPTIONS,
      } as any)
    )
    rerender()
    expect(mockHTTPRefetch).toHaveBeenCalled()
  })
})
