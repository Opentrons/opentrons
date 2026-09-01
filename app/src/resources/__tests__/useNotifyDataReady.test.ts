import { useDispatch } from 'react-redux'
import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { useHost } from '@opentrons/react-api-client'

import { useTrackEvent } from '/app/redux/analytics'
import { useFeatureFlag } from '/app/redux/config'
import { notifySubscribeAction } from '/app/redux/shell'
import { appShellListener } from '/app/redux/shell/remote'

import { useNotifyDataReady } from '../useNotifyDataReady'

import type { Mock } from 'vitest'
import type { HostConfig } from '@opentrons/api-client'
import type { QueryOptionsWithPolling } from '../useNotifyDataReady'

vi.unmock('../useNotifyDataReady')
vi.mock('react-redux')
vi.mock('@opentrons/react-api-client')
vi.mock('/app/redux/analytics')
vi.mock('/app/redux/config')
vi.mock('/app/redux/shell/remote', () => ({
  appShellListener: vi.fn(),
}))

const MOCK_HOST_CONFIG: HostConfig = { hostname: 'MOCK_HOST' }
const MOCK_TOPIC = '/test/topic' as any
const MOCK_OPTIONS: QueryOptionsWithPolling<any, any> = {
  forceHttpPolling: false,
}

describe('useNotifyDataReady', () => {
  let mockDispatch: Mock
  let mockTrackEvent: Mock

  beforeEach(() => {
    mockDispatch = vi.fn()
    mockTrackEvent = vi.fn()
    vi.mocked(useTrackEvent).mockReturnValue(mockTrackEvent)
    vi.mocked(useDispatch).mockReturnValue(mockDispatch)
    vi.mocked(useHost).mockReturnValue(MOCK_HOST_CONFIG)
    vi.mocked(appShellListener).mockClear()
    when(vi.mocked(useFeatureFlag))
      .calledWith('forceHttpPolling')
      .thenReturn(false)
  })

  afterEach(() => {
    vi.mocked(useDispatch).mockClear()
    vi.clearAllMocks()
  })

  it('should return queryOptionsNotify and refetch on a successful initial mount', () => {
    const { result } = renderHook(() =>
      useNotifyDataReady({
        topic: MOCK_TOPIC,
        options: MOCK_OPTIONS,
      } as any)
    )
    expect(result.current.refetch).toEqual(1)
    expect(result.current.queryOptionsNotify).toBeDefined()
    expect(mockDispatch).toHaveBeenCalledWith(
      notifySubscribeAction(MOCK_HOST_CONFIG.hostname, MOCK_TOPIC)
    )
    expect(appShellListener).toHaveBeenCalled()
  })

  it('should not subscribe to notifications if forceHttpPolling is true', () => {
    const { result } = renderHook(() =>
      useNotifyDataReady({
        topic: MOCK_TOPIC,
        options: { ...MOCK_OPTIONS, forceHttpPolling: true },
      } as any)
    )
    expect(result.current.refetch).toEqual(0)
    expect(appShellListener).not.toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should not subscribe to notifications if enabled is false', () => {
    const { result } = renderHook(() =>
      useNotifyDataReady({
        topic: MOCK_TOPIC,
        options: { ...MOCK_OPTIONS, enabled: false },
      } as any)
    )
    expect(result.current.refetch).toEqual(0)
    expect(appShellListener).not.toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should not subscribe to notifications if staleTime is Infinity', () => {
    const { result } = renderHook(() =>
      useNotifyDataReady({
        topic: MOCK_TOPIC,
        options: { ...MOCK_OPTIONS, staleTime: Infinity },
      } as any)
    )
    expect(result.current.refetch).toEqual(0)
    expect(appShellListener).not.toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should not request a refetch if there is an error', () => {
    vi.mocked(useHost).mockReturnValue({ hostname: null } as any)
    const errorSpy = vi.spyOn(console, 'error')
    errorSpy.mockImplementation(() => {})

    const { result } = renderHook(() =>
      useNotifyDataReady({
        topic: MOCK_TOPIC,
        options: MOCK_OPTIONS,
      } as any)
    )

    expect(result.current.refetch).toEqual(0)
  })

  it('should restore polling and fire an analytics reporting event if the connection was refused', () => {
    vi.mocked(appShellListener).mockImplementation(function ({
      callback,
    }): any {
      // eslint-disable-next-line n/no-callback-literal
      callback('ECONNREFUSED')
    })
    const { rerender, result } = renderHook(() =>
      useNotifyDataReady({
        topic: MOCK_TOPIC,
        options: { ...MOCK_OPTIONS, refetchInterval: 5000 },
      } as any)
    )
    expect(mockTrackEvent).toHaveBeenCalled()
    rerender()
    expect(result.current.queryOptionsNotify.refetchInterval).toEqual(5000)
  })

  it('should increment refetch if the refetch flag was returned', () => {
    vi.mocked(appShellListener).mockImplementation(function ({
      callback,
    }): any {
      callback({ refetch: true })
    })
    const { rerender, result } = renderHook(() =>
      useNotifyDataReady({
        topic: MOCK_TOPIC,
        options: MOCK_OPTIONS,
      } as any)
    )
    rerender()
    // One request from the initial mount, one from the notification.
    expect(result.current.refetch).toEqual(2)
  })

  it('should increment refetch if the unsubscribe flag was returned', () => {
    vi.mocked(appShellListener).mockImplementation(function ({
      callback,
    }): any {
      callback({ unsubscribe: true })
    })
    const { rerender, result } = renderHook(() =>
      useNotifyDataReady({
        topic: MOCK_TOPIC,
        options: MOCK_OPTIONS,
      } as any)
    )
    rerender()
    // One request from the initial mount, one from the notification.
    expect(result.current.refetch).toEqual(2)
  })

  it('should increment refetch for every notification so requests cannot collapse into one', () => {
    let capturedCallback: any
    vi.mocked(appShellListener).mockImplementation(function ({
      callback,
    }): any {
      capturedCallback = callback
    })

    const { result, rerender } = renderHook(() =>
      useNotifyDataReady({
        topic: MOCK_TOPIC,
        options: MOCK_OPTIONS,
      } as any)
    )

    expect(result.current.refetch).toEqual(1)

    capturedCallback({ refetch: true })
    rerender()
    expect(result.current.refetch).toEqual(2)

    // A notification arriving while a refetch is in flight must still be counted.
    capturedCallback({ refetch: true })
    capturedCallback({ unsubscribe: true })
    rerender()
    expect(result.current.refetch).toEqual(4)
  })

  it('should not reset refetch when the query settles', () => {
    let capturedCallback: any
    vi.mocked(appShellListener).mockImplementation(function ({
      callback,
    }): any {
      capturedCallback = callback
    })

    const mockOnSettled = vi.fn()
    const { result, rerender } = renderHook(() =>
      useNotifyDataReady({
        topic: MOCK_TOPIC,
        options: { ...MOCK_OPTIONS, onSettled: mockOnSettled },
      } as any)
    )

    capturedCallback({ refetch: true })
    rerender()
    expect(result.current.refetch).toEqual(2)

    result.current.queryOptionsNotify.onSettled?.(undefined, null)
    rerender()

    expect(result.current.refetch).toEqual(2)
    expect(mockOnSettled).toHaveBeenCalledTimes(1)
  })

  it('should clean up the listener on dismount', () => {
    const { unmount } = renderHook(() =>
      useNotifyDataReady({
        topic: MOCK_TOPIC,
        options: MOCK_OPTIONS,
      })
    )
    unmount()
    expect(appShellListener).toHaveBeenCalled()
  })

  it('should still clean up the listener if the hostname changes to null after subscribing', () => {
    const { unmount, rerender } = renderHook(() =>
      useNotifyDataReady({
        hostOverride: MOCK_HOST_CONFIG,
        topic: MOCK_TOPIC,
        options: MOCK_OPTIONS,
      })
    )
    rerender({ hostOverride: null })
    unmount()
    expect(appShellListener).toHaveBeenCalledWith(
      expect.objectContaining({ hostname: MOCK_HOST_CONFIG.hostname })
    )
  })

  it('should not utilize notifications if the feature flag is set to true', () => {
    when(vi.mocked(useFeatureFlag))
      .calledWith('forceHttpPolling')
      .thenReturn(true)

    const { result } = renderHook(() =>
      useNotifyDataReady({
        topic: MOCK_TOPIC,
        options: MOCK_OPTIONS,
      } as any)
    )

    expect(result.current.refetch).toEqual(0)
    expect(appShellListener).not.toHaveBeenCalled()
  })

  it('should return queryOptionsNotify with the original onSettled and polling disabled', () => {
    const { result } = renderHook(() =>
      useNotifyDataReady({
        topic: MOCK_TOPIC,
        options: {
          ...MOCK_OPTIONS,
          onSettled: vi.fn(),
          refetchInterval: 5000,
        },
      } as any)
    )
    expect(result.current.queryOptionsNotify.onSettled).toBeDefined()
    expect(result.current.queryOptionsNotify.refetchInterval).toBe(false)
  })

  it('should call the original onSettled function when notifications are disabled', () => {
    const mockOnSettled = vi.fn()
    const { result } = renderHook(() =>
      useNotifyDataReady({
        topic: MOCK_TOPIC,
        options: {
          ...MOCK_OPTIONS,
          forceHttpPolling: true,
          onSettled: mockOnSettled,
        },
      } as any)
    )
    result.current.queryOptionsNotify.onSettled?.(undefined, null)
    expect(mockOnSettled).toHaveBeenCalled()
  })

  it('should enable notifications if `enabled` is initially false and then becomes true', () => {
    const { rerender, result } = renderHook(
      props =>
        useNotifyDataReady({
          topic: MOCK_TOPIC,
          options: props,
        }),
      { initialProps: { enabled: false, refetchInterval: 5000 } }
    )
    expect(result.current.refetch).toEqual(0)

    rerender({ enabled: true, refetchInterval: 5000 })

    expect(result.current.refetch).toEqual(1)
  })
})
