import { QueryClient, QueryClientProvider } from 'react-query'
import { useDispatch, useStore } from 'react-redux'
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { useHost } from '@opentrons/react-api-client'

import { downloadAuditLogs } from '/app/redux/audit'
import { waitForStoreCondition } from '/app/redux/waitForStoreCondition'

import { useDownloadSelectedLogPeriods } from '../useDownloadSelectedLogPeriods'

import type * as React from 'react'
import type { HostConfig, LogPeriodSummary } from '@opentrons/api-client'
import type { LogPeriodDownloadDeleteStatus } from '/app/redux/audit'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/redux/waitForStoreCondition', () => ({
  waitForStoreCondition: vi.fn(),
}))
vi.mock('react-redux', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...(actual as Record<string, unknown>),
    useDispatch: vi.fn(),
    useStore: vi.fn(),
  }
})

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const ROBOT_NAME = 'otie'
const mockPeriodOne = {
  id: 'lp-1',
  startedAt: '2024-01-01T10:00:00.000Z',
  endedAt: '2024-01-01T11:00:00.000Z',
} as LogPeriodSummary
const mockPeriodTwo = {
  id: 'lp-2',
  startedAt: '2024-01-02T10:00:00.000Z',
  endedAt: null,
} as LogPeriodSummary

const mockDispatch = vi.fn()
const mockStore = {
  getState: vi.fn(),
  subscribe: vi.fn(),
  dispatch: vi.fn(),
  replaceReducer: vi.fn(),
  [Symbol.observable]: vi.fn(),
}

describe('useDownloadSelectedLogPeriods', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>

  beforeEach(() => {
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    vi.mocked(useDispatch).mockReturnValue(mockDispatch)
    vi.mocked(useStore).mockReturnValue(mockStore as any)
    when(vi.mocked(useHost)).calledWith().thenReturn(HOST_CONFIG)
    mockDispatch.mockClear()
    vi.mocked(waitForStoreCondition).mockReset()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should reject and not dispatch when given an empty array', async () => {
    const { result } = renderHook(
      () => useDownloadSelectedLogPeriods(ROBOT_NAME),
      {
        wrapper,
      }
    )

    await expect(
      result.current.mutateAsync({ logPeriods: [] })
    ).rejects.toThrow()

    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should dispatch downloadAuditLogs and resolve successful downloads', async () => {
    vi.mocked(waitForStoreCondition)
      .mockResolvedValueOnce({
        status: 'download-success',
        deletionKey: 'key-1',
      })
      .mockResolvedValueOnce({
        status: 'download-success',
        deletionKey: 'key-2',
      })

    const { result } = renderHook(
      () => useDownloadSelectedLogPeriods(ROBOT_NAME),
      {
        wrapper,
      }
    )

    const downloads = await result.current.mutateAsync({
      logPeriods: [mockPeriodOne, mockPeriodTwo],
    })

    expect(mockDispatch).toHaveBeenCalledWith(
      downloadAuditLogs({
        logPeriodSummaries: [mockPeriodOne, mockPeriodTwo],
        hostname: HOST_CONFIG.hostname,
        port: HOST_CONFIG.port,
        robotName: ROBOT_NAME,
        destination: undefined,
      })
    )
    expect(waitForStoreCondition).toHaveBeenCalledTimes(2)
    expect(downloads).toEqual([
      { logPeriod: mockPeriodOne, deletionKey: 'key-1' },
      { logPeriod: mockPeriodTwo, deletionKey: 'key-2' },
    ])
  })

  it('should pass callTimeUsbPath as destination', async () => {
    vi.mocked(waitForStoreCondition).mockResolvedValue({
      status: 'download-success',
      deletionKey: 'key-1',
    })

    const { result } = renderHook(
      () => useDownloadSelectedLogPeriods(ROBOT_NAME),
      {
        wrapper,
      }
    )

    await result.current.mutateAsync({
      logPeriods: [mockPeriodOne],
      callTimeUsbPath: '/mnt/usb',
    })

    expect(mockDispatch).toHaveBeenCalledWith(
      downloadAuditLogs({
        logPeriodSummaries: [mockPeriodOne],
        hostname: HOST_CONFIG.hostname,
        port: HOST_CONFIG.port,
        robotName: ROBOT_NAME,
        destination: '/mnt/usb',
      })
    )
  })

  it('should omit failed downloads from the result', async () => {
    vi.mocked(waitForStoreCondition)
      .mockResolvedValueOnce({
        status: 'download-success',
        deletionKey: 'key-1',
      })
      .mockResolvedValueOnce({
        status: 'download-failure',
        error: 'boom',
      })

    const { result } = renderHook(
      () => useDownloadSelectedLogPeriods(ROBOT_NAME),
      {
        wrapper,
      }
    )

    const downloads = await result.current.mutateAsync({
      logPeriods: [mockPeriodOne, mockPeriodTwo],
    })

    expect(downloads).toEqual([
      { logPeriod: mockPeriodOne, deletionKey: 'key-1' },
    ])
  })

  it('should reject when every download fails', async () => {
    vi.mocked(waitForStoreCondition).mockResolvedValue({
      status: 'download-failure',
      error: 'boom',
    })

    const { result } = renderHook(
      () => useDownloadSelectedLogPeriods(ROBOT_NAME),
      {
        wrapper,
      }
    )

    await expect(
      result.current.mutateAsync({
        logPeriods: [mockPeriodOne, mockPeriodTwo],
      })
    ).rejects.toThrow('Failed to download any of the selected log periods.')
  })

  it('should report a loading status while a download is in flight', async () => {
    let resolveWait: (status: LogPeriodDownloadDeleteStatus) => void = () => {}
    vi.mocked(waitForStoreCondition).mockImplementation(
      () =>
        new Promise(resolve => {
          resolveWait = resolve
        })
    )

    const { result } = renderHook(
      () => useDownloadSelectedLogPeriods(ROBOT_NAME),
      {
        wrapper,
      }
    )

    const firstCall = result.current.mutateAsync({
      logPeriods: [mockPeriodOne],
    })
    await waitFor(() => {
      expect(result.current.status).toEqual('loading')
    })

    resolveWait({ status: 'download-success', deletionKey: 'key-1' })
    await firstCall

    await waitFor(() => {
      expect(result.current.status).toEqual('success')
    })
  })
})
