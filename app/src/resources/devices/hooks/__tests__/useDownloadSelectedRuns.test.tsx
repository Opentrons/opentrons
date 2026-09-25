import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { DEFAULT_RUN_DOWNLOAD_PARAMS } from '@opentrons/api-client'
import { useAllProtocolsQuery, useHost } from '@opentrons/react-api-client'

import { saveLogs } from '/app/redux/shell/remote'

import { useDownloadSelectedRuns } from '../useDownloadSelectedRuns'

import type { FunctionComponent } from 'react'
import type { HostConfig, RunData } from '@opentrons/api-client'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/redux/shell/remote', () => ({
  saveLogs: vi.fn(),
}))
vi.mock('react-redux', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...(actual as Record<string, unknown>),
    useSelector: vi.fn(() => false),
  }
})

const HOST_CONFIG: HostConfig = {
  hostname: 'localhost',
  port: 31950,
}
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
    vi.mocked(saveLogs).mockClear()
    vi.mocked(saveLogs).mockImplementation(async ({ paths }) => ({
      directory: '/tmp',
      succeededPaths: paths.map(p => (typeof p === 'string' ? p : p.path)),
    }))
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should reject when given an empty array', async () => {
    const { result } = renderHook(() => useDownloadSelectedRuns(ROBOT_NAME), {
      wrapper,
    })

    await expect(result.current.mutateAsync({ runs: [] })).rejects.toThrow()

    expect(saveLogs).not.toHaveBeenCalled()
  })

  it('should zip all selected runs via saveLogs into one archive', async () => {
    const { result } = renderHook(() => useDownloadSelectedRuns(ROBOT_NAME), {
      wrapper,
    })

    const successful = await result.current.mutateAsync({
      runs: [mockRunOne, mockRunTwo],
    })

    const expectedParams = {
      ...DEFAULT_RUN_DOWNLOAD_PARAMS,
      protocol: false,
    }
    const search = new URLSearchParams(
      Object.entries(expectedParams).map(([key, value]) => [key, String(value)])
    )

    expect(saveLogs).toHaveBeenCalledWith({
      name: `${ROBOT_NAME}-run-records.zip`,
      paths: [
        {
          path: `/runs/run-1/download?${search.toString()}`,
          name: 'run-1_2024-01-01T10_00_00.000Z.zip',
        },
        {
          path: `/runs/run-2/download?${search.toString()}`,
          name: 'run-2_2024-01-02T10_00_00.000Z.zip',
        },
      ],
      hostname: 'localhost',
      port: 31950,
      destination: undefined,
    })
    expect(successful).toEqual([mockRunOne, mockRunTwo])
  })

  it('should save to the destination when provided', async () => {
    const { result } = renderHook(() => useDownloadSelectedRuns(ROBOT_NAME), {
      wrapper,
    })

    await result.current.mutateAsync({
      runs: [mockRunOne],
      destination: '/mnt/usb',
    })

    expect(saveLogs).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: '/mnt/usb',
      })
    )
  })

  it('should reject when the user cancels the save dialog', async () => {
    const cancelError = new Error('File save canceled')
    cancelError.name = 'FileSaveCanceledError'
    vi.mocked(saveLogs).mockRejectedValue(cancelError)
    const { result } = renderHook(() => useDownloadSelectedRuns(ROBOT_NAME), {
      wrapper,
    })

    await expect(
      result.current.mutateAsync({ runs: [mockRunOne] })
    ).rejects.toThrow('File save canceled')
  })

  it('should reject when every run fails to download', async () => {
    vi.mocked(saveLogs).mockResolvedValue({
      directory: '/tmp',
      succeededPaths: [],
    })
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
    let resolveSave: (value: {
      directory: string
      succeededPaths: string[]
    }) => void = () => {}
    vi.mocked(saveLogs).mockImplementation(
      () =>
        new Promise(resolve => {
          resolveSave = resolve
        })
    )
    const { result } = renderHook(() => useDownloadSelectedRuns(ROBOT_NAME), {
      wrapper,
    })

    const firstCall = result.current.mutateAsync({ runs: [mockRunOne] })
    await waitFor(() => {
      expect(result.current.status).toEqual('loading')
    })

    const calledPaths = vi.mocked(saveLogs).mock.calls[0][0].paths
    resolveSave({
      directory: '/tmp',
      succeededPaths: calledPaths.map(p =>
        typeof p === 'string' ? p : p.path
      ),
    })
    await firstCall

    await waitFor(() => {
      expect(result.current.status).toEqual('success')
    })
  })
})
