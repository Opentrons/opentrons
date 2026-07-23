import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { getRunRaw } from '@opentrons/api-client'
import { useAllProtocolsQuery, useHost } from '@opentrons/react-api-client'

import { saveFileToUsb } from '/app/redux/shell/remote'

import { useDownloadSelectedRuns } from '../useDownloadSelectedRuns'

import type { HostConfig, RunData } from '@opentrons/api-client'

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
vi.mock('@opentrons/api-client')
vi.mock('@opentrons/react-api-client')
vi.mock('/app/redux/shell/remote', () => ({ saveFileToUsb: vi.fn() }))

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const ROBOT_NAME = 'otie'
const mockRunOne = {
  id: 'run-1',
  createdAt: '2024-01-01T10:00:00.000Z',
  protocolId: null,
} as unknown as RunData
const mockRunTwo = {
  id: 'run-2',
  createdAt: '2024-01-02T10:00:00.000Z',
  protocolId: null,
} as unknown as RunData

describe('useDownloadSelectedRuns', () => {
  beforeEach(() => {
    when(vi.mocked(useHost)).calledWith().thenReturn(HOST_CONFIG)
    vi.mocked(useAllProtocolsQuery).mockReturnValue({ data: undefined } as any)
    vi.mocked(getRunRaw).mockResolvedValue({
      data: { arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) },
    } as any)
    mockJSZip.file.mockClear()
    mockJSZip.generateAsync.mockClear()
    mockJSZip.generateAsync.mockResolvedValue(new ArrayBuffer(0))
    mockSaveAs.mockClear()
    vi.mocked(saveFileToUsb).mockClear()
    vi.mocked(saveFileToUsb).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should reject and not fetch when given an empty array', async () => {
    const { result } = renderHook(() => useDownloadSelectedRuns(ROBOT_NAME))

    await expect(result.current.downloadRuns([])).rejects.toThrow()

    expect(getRunRaw).not.toHaveBeenCalled()
  })

  it('should fetch every run, zip them, and save via the browser when no usbPath is given', async () => {
    const { result } = renderHook(() => useDownloadSelectedRuns(ROBOT_NAME))

    await result.current.downloadRuns([mockRunOne, mockRunTwo])

    expect(getRunRaw).toHaveBeenCalledWith(HOST_CONFIG, 'run-1', 'blob')
    expect(getRunRaw).toHaveBeenCalledWith(HOST_CONFIG, 'run-2', 'blob')
    expect(mockJSZip.file).toHaveBeenCalledWith(
      'run-1_2024-01-01T10_00_00.000Z.zip',
      expect.any(ArrayBuffer)
    )
    expect(mockJSZip.file).toHaveBeenCalledWith(
      'run-2_2024-01-02T10_00_00.000Z.zip',
      expect.any(ArrayBuffer)
    )
    expect(mockSaveAs).toHaveBeenCalledWith(
      expect.any(Blob),
      `${ROBOT_NAME}-run-records.zip`
    )
    expect(saveFileToUsb).not.toHaveBeenCalled()
  })

  it('should save to the usbPath instead of the browser when provided', async () => {
    const { result } = renderHook(() => useDownloadSelectedRuns(ROBOT_NAME))

    await result.current.downloadRuns([mockRunOne], '/mnt/usb')

    expect(saveFileToUsb).toHaveBeenCalledWith(
      `/mnt/usb/${ROBOT_NAME}-run-records.zip`,
      expect.any(ArrayBuffer)
    )
    expect(mockSaveAs).not.toHaveBeenCalled()
  })

  it('should prefer a call-time usbPath over the one passed to the hook', async () => {
    const { result } = renderHook(() => useDownloadSelectedRuns(ROBOT_NAME))

    await result.current.downloadRuns([mockRunOne], '/mnt/other-usb')

    expect(saveFileToUsb).toHaveBeenCalledWith(
      `/mnt/other-usb/${ROBOT_NAME}-run-records.zip`,
      expect.any(ArrayBuffer)
    )
  })

  it('should set hasError and stop downloading when a run fails to fetch', async () => {
    vi.mocked(getRunRaw).mockRejectedValue(new Error('nope'))
    const { result } = renderHook(() => useDownloadSelectedRuns(ROBOT_NAME))

    await result.current.downloadRuns([mockRunOne]).catch(() => {})

    await waitFor(() => {
      expect(result.current.hasError).toEqual(true)
    })
    expect(result.current.isDownloading).toEqual(false)
  })

  it('should ignore a second call while a download is already in flight', async () => {
    let resolveFirstFetch: () => void = () => {}
    vi.mocked(getRunRaw).mockImplementation(
      () =>
        new Promise(resolve => {
          resolveFirstFetch = () => {
            resolve({
              data: { arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) },
            } as any)
          }
        })
    )
    const { result } = renderHook(() => useDownloadSelectedRuns(ROBOT_NAME))

    const firstCall = result.current.downloadRuns([mockRunOne])
    await waitFor(() => {
      expect(result.current.isDownloading).toEqual(true)
    })

    await result.current.downloadRuns([mockRunTwo]).catch(() => {})

    expect(getRunRaw).toHaveBeenCalledTimes(1)
    expect(getRunRaw).toHaveBeenCalledWith(HOST_CONFIG, 'run-1', 'blob')

    resolveFirstFetch()
    await firstCall
  })
})
