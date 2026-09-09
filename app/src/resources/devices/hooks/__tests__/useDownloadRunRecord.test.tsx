import { QueryClient, QueryClientProvider } from 'react-query'
import { Provider } from 'react-redux'
import { renderHook, waitFor } from '@testing-library/react'
import { legacy_createStore } from 'redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { DEFAULT_RUN_DOWNLOAD_PARAMS } from '@opentrons/api-client'
import { useAllProtocolsQuery, useHost } from '@opentrons/react-api-client'

import { useDownloadRunRecord } from '../useDownloadRunRecord'

import type { Store } from 'redux'
import type { FunctionComponent, ReactNode } from 'react'
import type { HostConfig, RunData } from '@opentrons/api-client'

const mockInvoke = vi.hoisted(() => vi.fn())

vi.mock('@opentrons/react-api-client')
vi.mock('/app/redux/shell/remote', () => ({
  remote: {
    ipcRenderer: {
      invoke: mockInvoke,
    },
  },
}))
vi.mock('react-redux', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...(actual as Record<string, unknown>),
    useSelector: vi.fn(() => false),
  }
})

const HOST_CONFIG: HostConfig = {
  hostname: '10.0.0.5',
  port: 31950,
  token: 'access-token',
}
const mockRun = {
  id: 'run-1',
  createdAt: '2024-01-01T10:00:00.000Z',
  protocolId: 'protocol-1',
} as unknown as RunData

describe('useDownloadRunRecord', () => {
  let wrapper: FunctionComponent<{ children: ReactNode }>
  let onError: ReturnType<typeof vi.fn>

  beforeEach(() => {
    const store: Store<any> = legacy_createStore(vi.fn(), {})
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Provider>
    )
    onError = vi.fn()
    mockInvoke.mockReset()
    mockInvoke.mockResolvedValue('/tmp/downloads')
    when(vi.mocked(useHost)).calledWith().thenReturn(HOST_CONFIG)
    vi.mocked(useAllProtocolsQuery).mockReturnValue({
      data: {
        data: [{ id: 'protocol-1', metadata: { protocolName: 'My Protocol' } }],
      },
    } as any)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('invokes saveFileFromUrl with download query params and returns the destination', async () => {
    const { result } = renderHook(
      () => useDownloadRunRecord(mockRun, onError),
      { wrapper }
    )

    await expect(result.current.downloadRunRecord('/tmp/usb')).resolves.toBe(
      '/tmp/downloads'
    )

    const expectedParams = {
      ...DEFAULT_RUN_DOWNLOAD_PARAMS,
      protocol: false,
    }
    const search = new URLSearchParams(
      Object.entries(expectedParams).map(([key, value]) => [key, String(value)])
    )

    expect(mockInvoke).toHaveBeenCalledWith('downloads:saveFileFromUrl', {
      name: 'My Protocol_2024-01-01T10_00_00.000Z.zip',
      source: `/runs/run-1/download?${search.toString()}`,
      hostname: '10.0.0.5',
      port: 31950,
      destination: '/tmp/usb',
      token: 'access-token',
      secure: undefined,
    })
    expect(onError).not.toHaveBeenCalled()
  })

  it('silently returns when the save is canceled', async () => {
    const cancelError = new Error('File save canceled')
    cancelError.name = 'FileSaveCanceledError'
    mockInvoke.mockRejectedValue(cancelError)

    const { result } = renderHook(
      () => useDownloadRunRecord(mockRun, onError),
      { wrapper }
    )

    await expect(result.current.downloadRunRecord()).resolves.toBeUndefined()
    expect(onError).not.toHaveBeenCalled()
  })

  it('silently returns on empty download errors', async () => {
    const emptyError = new Error('Empty download')
    emptyError.name = 'EmptyDownloadError'
    mockInvoke.mockRejectedValue(emptyError)

    const { result } = renderHook(
      () => useDownloadRunRecord(mockRun, onError),
      { wrapper }
    )

    await expect(result.current.downloadRunRecord()).resolves.toBeUndefined()
    expect(onError).not.toHaveBeenCalled()
  })

  it('calls onError and rethrows other failures', async () => {
    mockInvoke.mockRejectedValue(new Error('network down'))

    const { result } = renderHook(
      () => useDownloadRunRecord(mockRun, onError),
      { wrapper }
    )

    await expect(result.current.downloadRunRecord()).rejects.toThrow(
      'network down'
    )
    expect(onError).toHaveBeenCalledWith(expect.any(Error))
  })

  it('tracks isDownloading while the IPC call is in flight', async () => {
    let resolveInvoke: (value: string) => void = () => {}
    mockInvoke.mockImplementation(
      () =>
        new Promise<string>(resolve => {
          resolveInvoke = resolve
        })
    )

    const { result } = renderHook(
      () => useDownloadRunRecord(mockRun, onError),
      { wrapper }
    )

    const pending = result.current.downloadRunRecord()
    await waitFor(() => {
      expect(result.current.isDownloading).toBe(true)
    })

    resolveInvoke('/tmp')
    await pending

    await waitFor(() => {
      expect(result.current.isDownloading).toBe(false)
    })
  })
})
