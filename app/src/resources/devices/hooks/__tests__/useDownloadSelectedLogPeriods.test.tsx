import { QueryClient, QueryClientProvider } from 'react-query'
import { useDispatch } from 'react-redux'
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import {
  getLogPeriodRaw,
  LOG_PERIOD_DELETION_KEY_HEADER,
} from '@opentrons/api-client'
import { useHost } from '@opentrons/react-api-client'

import { logPeriodDeletionKeyReceived } from '/app/redux/audit'
import { saveFileToUsb } from '/app/redux/shell/remote'

import { useDownloadSelectedLogPeriods } from '../useDownloadSelectedLogPeriods'

import type * as React from 'react'
import type { HostConfig, LogPeriodSummary } from '@opentrons/api-client'

const mockJSZip = vi.hoisted(() => ({
  file: vi.fn(),
  generateAsync: vi.fn(),
}))
const mockSaveAs = vi.hoisted(() => vi.fn())
const MockJSZip = vi.hoisted(
  () =>
    function MockJSZip() {
      return mockJSZip
    }
)

vi.mock('file-saver', () => ({ saveAs: mockSaveAs }))
vi.mock('jszip', () => ({ default: MockJSZip }))
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

describe('useDownloadSelectedLogPeriods', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>

  beforeEach(() => {
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    vi.mocked(useDispatch).mockReturnValue(mockDispatch)
    when(vi.mocked(useHost)).calledWith().thenReturn(HOST_CONFIG)
    vi.mocked(getLogPeriodRaw).mockResolvedValue({
      data: { arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) },
      headers: { [LOG_PERIOD_DELETION_KEY_HEADER]: 'key-for-lp' },
    } as any)
    mockJSZip.file.mockClear()
    mockJSZip.generateAsync.mockClear()
    mockJSZip.generateAsync.mockResolvedValue(new ArrayBuffer(0))
    mockSaveAs.mockClear()
    mockDispatch.mockClear()
    vi.mocked(saveFileToUsb).mockClear()
    vi.mocked(saveFileToUsb).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should reject and not fetch when given an empty array', async () => {
    const { result } = renderHook(
      () => useDownloadSelectedLogPeriods(ROBOT_NAME),
      {
        wrapper,
      }
    )

    await expect(
      result.current.mutateAsync({ logPeriods: [] })
    ).rejects.toThrow()

    expect(getLogPeriodRaw).not.toHaveBeenCalled()
  })

  it('should fetch every log period, zip them, and save via the browser when no usbPath is given', async () => {
    const { result } = renderHook(
      () => useDownloadSelectedLogPeriods(ROBOT_NAME),
      {
        wrapper,
      }
    )

    await result.current.mutateAsync({
      logPeriods: [mockPeriodOne, mockPeriodTwo],
    })

    expect(getLogPeriodRaw).toHaveBeenCalledWith(HOST_CONFIG, 'lp-1', 'blob')
    expect(getLogPeriodRaw).toHaveBeenCalledWith(HOST_CONFIG, 'lp-2', 'blob')
    expect(mockJSZip.file).toHaveBeenCalledWith(
      'logperiod_2024-01-01T10_00_00.000Z.zip',
      expect.any(ArrayBuffer)
    )
    expect(mockJSZip.file).toHaveBeenCalledWith(
      'logperiod_2024-01-02T10_00_00.000Z.zip',
      expect.any(ArrayBuffer)
    )
    expect(mockSaveAs).toHaveBeenCalledWith(
      expect.any(Blob),
      `${ROBOT_NAME}-log-periods.zip`
    )
    expect(saveFileToUsb).not.toHaveBeenCalled()
  })

  it('should save to the usbPath instead of the browser when provided', async () => {
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

    expect(saveFileToUsb).toHaveBeenCalledWith(
      `/mnt/usb/${ROBOT_NAME}-log-periods.zip`,
      expect.any(ArrayBuffer)
    )
    expect(mockSaveAs).not.toHaveBeenCalled()
  })

  it('should dispatch the deletion key from the response header for every period', async () => {
    const { result } = renderHook(
      () => useDownloadSelectedLogPeriods(ROBOT_NAME),
      {
        wrapper,
      }
    )

    await result.current.mutateAsync({
      logPeriods: [mockPeriodOne, mockPeriodTwo],
    })

    expect(mockDispatch).toHaveBeenCalledWith(
      logPeriodDeletionKeyReceived({
        logPeriodId: 'lp-1',
        deletionKey: 'key-for-lp',
      })
    )
    expect(mockDispatch).toHaveBeenCalledWith(
      logPeriodDeletionKeyReceived({
        logPeriodId: 'lp-2',
        deletionKey: 'key-for-lp',
      })
    )
  })

  it('should not dispatch a deletion key when the header is absent', async () => {
    vi.mocked(getLogPeriodRaw).mockResolvedValue({
      data: { arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) },
      headers: {},
    } as any)
    const { result } = renderHook(
      () => useDownloadSelectedLogPeriods(ROBOT_NAME),
      {
        wrapper,
      }
    )

    await result.current.mutateAsync({ logPeriods: [mockPeriodOne] })

    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should report an error status and stop loading when a log period fails to fetch', async () => {
    vi.mocked(getLogPeriodRaw).mockRejectedValue(new Error('nope'))
    const { result } = renderHook(
      () => useDownloadSelectedLogPeriods(ROBOT_NAME),
      {
        wrapper,
      }
    )

    await result.current
      .mutateAsync({ logPeriods: [mockPeriodOne] })
      .catch(() => {})

    await waitFor(() => {
      expect(result.current.status).toEqual('error')
    })
    expect(result.current.isLoading).toEqual(false)
  })

  it('should report a loading status while a download is in flight', async () => {
    let resolveFirstFetch: () => void = () => {}
    vi.mocked(getLogPeriodRaw).mockImplementation(
      () =>
        new Promise(resolve => {
          resolveFirstFetch = () => {
            resolve({
              data: { arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) },
              headers: { [LOG_PERIOD_DELETION_KEY_HEADER]: 'key-for-lp' },
            } as any)
          }
        }) as any
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

    resolveFirstFetch()
    await firstCall

    await waitFor(() => {
      expect(result.current.status).toEqual('success')
    })
  })
})
