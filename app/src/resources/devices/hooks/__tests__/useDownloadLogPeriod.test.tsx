import { useDispatch, useStore } from 'react-redux'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { useHost } from '@opentrons/react-api-client'

import { downloadAuditLog } from '/app/redux/audit'
import { waitForStoreCondition } from '/app/redux/waitForStoreCondition'

import { useDownloadLogPeriod } from '../useDownloadLogPeriod'

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
const mockPeriod = {
  id: 'lp-1',
  startedAt: '2024-01-01T10:00:00.000Z',
  endedAt: '2024-01-01T11:00:00.000Z',
} as LogPeriodSummary

const mockDispatch = vi.fn()
const mockStore = {
  getState: vi.fn(),
  subscribe: vi.fn(),
  dispatch: vi.fn(),
  replaceReducer: vi.fn(),
  [Symbol.observable]: vi.fn(),
}

describe('useDownloadLogPeriod', () => {
  beforeEach(() => {
    vi.mocked(useDispatch).mockReturnValue(mockDispatch)
    vi.mocked(useStore).mockReturnValue(mockStore as any)
    when(vi.mocked(useHost)).calledWith().thenReturn(HOST_CONFIG)
    mockDispatch.mockClear()
    vi.mocked(waitForStoreCondition).mockReset()
    vi.mocked(waitForStoreCondition).mockResolvedValue({
      status: 'download-success',
      deletionKey: 'key-for-lp',
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should not dispatch when there is no host', async () => {
    when(vi.mocked(useHost)).calledWith().thenReturn(null)
    const { result } = renderHook(() => useDownloadLogPeriod(mockPeriod))

    await result.current.downloadLogPeriod()

    expect(mockDispatch).not.toHaveBeenCalled()
    expect(waitForStoreCondition).not.toHaveBeenCalled()
  })

  it('should dispatch downloadAuditLog with a filename built from the start date', async () => {
    const { result } = renderHook(() => useDownloadLogPeriod(mockPeriod))

    await act(async () => {
      await result.current.downloadLogPeriod()
    })

    expect(mockDispatch).toHaveBeenCalledWith(
      downloadAuditLog({
        logPeriodId: 'lp-1',
        fileName: 'logperiod_2024-01-01T10_00_00.000Z.zip',
        hostname: HOST_CONFIG.hostname,
        port: HOST_CONFIG.port,
        destination: undefined,
      })
    )
  })

  it('should pass the usbPath as the destination when provided', async () => {
    const { result } = renderHook(() => useDownloadLogPeriod(mockPeriod))

    await act(async () => {
      await result.current.downloadLogPeriod('/mnt/usb')
    })

    expect(mockDispatch).toHaveBeenCalledWith(
      downloadAuditLog({
        logPeriodId: 'lp-1',
        fileName: 'logperiod_2024-01-01T10_00_00.000Z.zip',
        hostname: HOST_CONFIG.hostname,
        port: HOST_CONFIG.port,
        destination: '/mnt/usb',
      })
    )
  })

  it('should report isDownloading while the download is in flight', async () => {
    let resolveWait: (status: LogPeriodDownloadDeleteStatus) => void = () => {}
    vi.mocked(waitForStoreCondition).mockImplementation(
      () =>
        new Promise(resolve => {
          resolveWait = resolve
        })
    )

    const { result } = renderHook(() => useDownloadLogPeriod(mockPeriod))

    let download: Promise<string | null> = Promise.resolve(null)
    act(() => {
      download = result.current.downloadLogPeriod()
    })

    await waitFor(() => {
      expect(result.current.isDownloading).toEqual(true)
    })

    await act(async () => {
      resolveWait({ status: 'download-success', deletionKey: 'key-for-lp' })
      await download
    })

    expect(result.current.isDownloading).toEqual(false)
  })

  it('should call onError and stop downloading when the download fails', async () => {
    vi.mocked(waitForStoreCondition).mockResolvedValue({
      status: 'download-failure',
      error: 'nope',
    })
    const onError = vi.fn()
    const { result } = renderHook(() =>
      useDownloadLogPeriod(mockPeriod, onError)
    )

    await act(async () => {
      await result.current.downloadLogPeriod().catch(() => {})
    })

    expect(onError).toHaveBeenCalledWith(new Error('nope'))
    expect(result.current.isDownloading).toEqual(false)
  })
})
