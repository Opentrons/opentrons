import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { DEFAULT_RUN_DOWNLOAD_PARAMS, getRunRaw } from '@opentrons/api-client'
import { useAllProtocolsQuery, useHost } from '@opentrons/react-api-client'

import { saveFileWithPicker } from '/app/local-resources/files/saveFileWithPicker'
import { saveFileToUsb } from '/app/redux/shell/remote'

import { useDownloadSelectedRuns } from '../useDownloadSelectedRuns'

import type { FunctionComponent } from 'react'
import type { HostConfig, RunData } from '@opentrons/api-client'

const mockJSZip = vi.hoisted(() => ({
  file: vi.fn(),
  generateAsync: vi.fn(),
}))
const MockJSZip = vi.hoisted(
  () =>
    function MockJSZip() {
      return mockJSZip
    }
)

vi.mock('jszip', () => ({ default: MockJSZip }))
vi.mock('@opentrons/api-client')
vi.mock('@opentrons/react-api-client')
vi.mock('/app/redux/shell/remote', () => ({
  saveFileToUsb: vi.fn(),
}))
vi.mock('/app/local-resources/files/saveFileWithPicker', () => ({
  saveFileWithPicker: vi.fn(),
  FileSaveCanceledError: class FileSaveCanceledError extends Error {
    readonly isFileSaveCanceled = true
    constructor() {
      super('File save canceled')
      this.name = 'FileSaveCanceledError'
    }
  },
}))
vi.mock('react-redux', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...(actual as Record<string, unknown>),
    useSelector: vi.fn(() => false),
  }
})

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
  let wrapper: FunctionComponent<{ children: React.ReactNode }>

  beforeEach(() => {
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    when(vi.mocked(useHost)).calledWith().thenReturn(HOST_CONFIG)
    vi.mocked(useAllProtocolsQuery).mockReturnValue({ data: undefined } as any)
    vi.mocked(getRunRaw).mockResolvedValue({
      data: { arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) },
    } as any)
    mockJSZip.file.mockClear()
    mockJSZip.generateAsync.mockClear()
    mockJSZip.generateAsync.mockResolvedValue(new ArrayBuffer(0))
    vi.mocked(saveFileWithPicker).mockClear()
    vi.mocked(saveFileWithPicker).mockResolvedValue(undefined)
    vi.mocked(saveFileToUsb).mockClear()
    vi.mocked(saveFileToUsb).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should reject and not fetch when given an empty array', async () => {
    const { result } = renderHook(() => useDownloadSelectedRuns(ROBOT_NAME), {
      wrapper,
    })

    await expect(result.current.mutateAsync({ runs: [] })).rejects.toThrow()

    expect(getRunRaw).not.toHaveBeenCalled()
  })

  it('should fetch every run, zip them, and save via the browser when no usbPath is given', async () => {
    const { result } = renderHook(() => useDownloadSelectedRuns(ROBOT_NAME), {
      wrapper,
    })

    await result.current.mutateAsync({ runs: [mockRunOne, mockRunTwo] })

    expect(getRunRaw).toHaveBeenCalledWith(
      HOST_CONFIG,
      'run-1',
      DEFAULT_RUN_DOWNLOAD_PARAMS,
      'blob'
    )
    expect(getRunRaw).toHaveBeenCalledWith(
      HOST_CONFIG,
      'run-2',
      DEFAULT_RUN_DOWNLOAD_PARAMS,
      'blob'
    )
    expect(mockJSZip.file).toHaveBeenCalledWith(
      'run-1_2024-01-01T10_00_00.000Z.zip',
      expect.any(ArrayBuffer)
    )
    expect(mockJSZip.file).toHaveBeenCalledWith(
      'run-2_2024-01-02T10_00_00.000Z.zip',
      expect.any(ArrayBuffer)
    )
    expect(saveFileWithPicker).toHaveBeenCalledWith(
      `${ROBOT_NAME}-run-records.zip`,
      expect.any(ArrayBuffer)
    )
    expect(saveFileToUsb).not.toHaveBeenCalled()
  })

  it('should save to the usbPath instead of the browser when provided', async () => {
    const { result } = renderHook(() => useDownloadSelectedRuns(ROBOT_NAME), {
      wrapper,
    })

    await result.current.mutateAsync({
      runs: [mockRunOne],
      callTimeUsbPath: '/mnt/usb',
    })

    expect(saveFileToUsb).toHaveBeenCalledWith(
      `/mnt/usb/${ROBOT_NAME}-run-records.zip`,
      expect.any(ArrayBuffer)
    )
    expect(saveFileWithPicker).not.toHaveBeenCalled()
  })

  it('should reject when the user cancels the save dialog', async () => {
    const { FileSaveCanceledError } =
      await import('/app/local-resources/files/saveFileWithPicker')
    vi.mocked(saveFileWithPicker).mockRejectedValue(new FileSaveCanceledError())
    const { result } = renderHook(() => useDownloadSelectedRuns(ROBOT_NAME), {
      wrapper,
    })

    await expect(
      result.current.mutateAsync({ runs: [mockRunOne] })
    ).rejects.toThrow('File save canceled')
  })

  it('should reject when every run fails to fetch', async () => {
    vi.mocked(getRunRaw).mockRejectedValue(new Error('nope'))
    const { result } = renderHook(() => useDownloadSelectedRuns(ROBOT_NAME), {
      wrapper,
    })

    await expect(
      result.current.mutateAsync({ runs: [mockRunOne] })
    ).rejects.toThrow('Failed to download any of the selected run records.')

    await waitFor(() => {
      expect(result.current.status).toEqual('error')
    })
  })

  it('should report a loading status while a download is in flight', async () => {
    let resolveFetch: () => void = () => {}
    vi.mocked(getRunRaw).mockImplementation(
      () =>
        new Promise(resolve => {
          resolveFetch = () => {
            resolve({
              data: { arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) },
            } as any)
          }
        })
    )
    const { result } = renderHook(() => useDownloadSelectedRuns(ROBOT_NAME), {
      wrapper,
    })

    const firstCall = result.current.mutateAsync({ runs: [mockRunOne] })
    await waitFor(() => {
      expect(result.current.status).toEqual('loading')
    })

    resolveFetch()
    await firstCall

    await waitFor(() => {
      expect(result.current.status).toEqual('success')
    })
  })
})
