import { useDispatch } from 'react-redux'
import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import {
  getLogPeriodRaw,
  LOG_PERIOD_DELETION_KEY_HEADER,
} from '@opentrons/api-client'
import { useHost } from '@opentrons/react-api-client'

import { logPeriodDeletionKeyReceived } from '/app/redux/audit'
import { saveFileToUsb } from '/app/redux/shell/remote'

import { useDownloadLogPeriod } from '../useDownloadLogPeriod'

import type { HostConfig, LogPeriodSummary } from '@opentrons/api-client'

const mockSaveAs = vi.hoisted(() => vi.fn())

vi.mock('file-saver', () => ({ saveAs: mockSaveAs }))
vi.mock('@opentrons/api-client', async importOriginal => {
  const actual = await importOriginal<typeof getLogPeriodRaw>()
  return { ...actual, getLogPeriodRaw: vi.fn() }
})
vi.mock('@opentrons/react-api-client')
vi.mock('/app/redux/shell/remote', () => ({ saveFileToUsb: vi.fn() }))
vi.mock('react-redux', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...(actual as Record<string, unknown>),
    useDispatch: vi.fn(),
  }
})

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const mockPeriod = {
  id: 'lp-1',
  startedAt: '2024-01-01T10:00:00.000Z',
  endedAt: '2024-01-01T11:00:00.000Z',
} as LogPeriodSummary

const mockDispatch = vi.fn()

describe('useDownloadLogPeriod', () => {
  beforeEach(() => {
    vi.mocked(useDispatch).mockReturnValue(mockDispatch)
    when(vi.mocked(useHost)).calledWith().thenReturn(HOST_CONFIG)
    vi.mocked(getLogPeriodRaw).mockResolvedValue({
      data: { arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) },
      headers: { [LOG_PERIOD_DELETION_KEY_HEADER]: 'key-for-lp' },
    } as any)
    mockSaveAs.mockClear()
    mockDispatch.mockClear()
    vi.mocked(saveFileToUsb).mockClear()
    vi.mocked(saveFileToUsb).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should not fetch when there is no host', async () => {
    when(vi.mocked(useHost)).calledWith().thenReturn(null)
    const { result } = renderHook(() => useDownloadLogPeriod(mockPeriod))

    await result.current.downloadLogPeriod()

    expect(getLogPeriodRaw).not.toHaveBeenCalled()
  })

  it('should fetch the log period and save via the browser when no usbPath is given', async () => {
    const { result } = renderHook(() => useDownloadLogPeriod(mockPeriod))

    await result.current.downloadLogPeriod()

    expect(getLogPeriodRaw).toHaveBeenCalledWith(HOST_CONFIG, 'lp-1', 'blob')
    expect(mockSaveAs).toHaveBeenCalledWith(
      expect.anything(),
      'logperiod_2024-01-01T10_00_00.000Z.zip'
    )
    expect(saveFileToUsb).not.toHaveBeenCalled()
  })

  it('should save to the usbPath instead of the browser when provided', async () => {
    const { result } = renderHook(() => useDownloadLogPeriod(mockPeriod))

    await result.current.downloadLogPeriod('/mnt/usb')

    expect(saveFileToUsb).toHaveBeenCalledWith(
      '/mnt/usb/logperiod_2024-01-01T10_00_00.000Z.zip',
      expect.any(ArrayBuffer)
    )
    expect(mockSaveAs).not.toHaveBeenCalled()
  })

  it('should dispatch the deletion key from the response header', async () => {
    const { result } = renderHook(() => useDownloadLogPeriod(mockPeriod))

    await result.current.downloadLogPeriod()

    expect(mockDispatch).toHaveBeenCalledWith(
      logPeriodDeletionKeyReceived({
        logPeriodId: 'lp-1',
        deletionKey: 'key-for-lp',
      })
    )
  })

  it('should not dispatch a deletion key when the header is absent', async () => {
    vi.mocked(getLogPeriodRaw).mockResolvedValue({
      data: { arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) },
      headers: {},
    } as any)
    const { result } = renderHook(() => useDownloadLogPeriod(mockPeriod))

    await result.current.downloadLogPeriod()

    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should call onError and stop downloading when the fetch fails', async () => {
    const error = new Error('nope')
    vi.mocked(getLogPeriodRaw).mockRejectedValue(error)
    const onError = vi.fn()
    const { result } = renderHook(() =>
      useDownloadLogPeriod(mockPeriod, onError)
    )

    await result.current.downloadLogPeriod().catch(() => {})

    expect(onError).toHaveBeenCalledWith(error)
    expect(result.current.isDownloading).toEqual(false)
  })
})
