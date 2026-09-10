import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { getCommands, getProtocol, getRun } from '@opentrons/api-client'
import { useHost } from '@opentrons/react-api-client'

import { useToaster } from '/app/organisms/ToasterOven'
import { saveFileFromBuffer } from '/app/redux/shell/remote'

import { useDownloadRunLog } from '../useDownloadRunLog'

import type { FunctionComponent, ReactNode } from 'react'
import type { HostConfig } from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('@opentrons/react-api-client')
vi.mock('/app/organisms/ToasterOven')
vi.mock('/app/redux/shell/remote', () => ({
  saveFileFromBuffer: vi.fn().mockResolvedValue('/tmp'),
}))
vi.mock('/app/local-resources/files/fileSaveCanceledError', () => ({
  isFileSaveCanceledError: vi.fn(() => false),
}))

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const ROBOT_NAME = 'otie'
const RUN_ID = 'run-1'

describe('useDownloadRunLog', () => {
  let wrapper: FunctionComponent<{ children: ReactNode }>
  let makeToast: ReturnType<typeof vi.fn>

  beforeEach(() => {
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    makeToast = vi.fn()
    when(vi.mocked(useHost)).calledWith().thenReturn(HOST_CONFIG)
    when(vi.mocked(useToaster))
      .calledWith()
      .thenReturn({
        makeToast,
        eatToast: vi.fn(),
      } as any)
    vi.mocked(getCommands)
      .mockResolvedValueOnce({
        data: { meta: { totalLength: 1 }, data: [] },
      } as any)
      .mockResolvedValueOnce({
        data: { data: [{ id: 'cmd-1' }] },
      } as any)
    vi.mocked(getRun).mockResolvedValue({
      data: {
        data: {
          protocolId: null,
          createdAt: '2024-01-01T10:00:00.000Z',
        },
      },
    } as any)
    vi.mocked(saveFileFromBuffer).mockResolvedValue('/tmp')
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('saves the run log JSON via saveFileFromBuffer', async () => {
    const { result } = renderHook(() => useDownloadRunLog(ROBOT_NAME, RUN_ID), {
      wrapper,
    })

    result.current.downloadRunLog()

    await waitFor(() => {
      expect(saveFileFromBuffer).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.stringContaining(`${ROBOT_NAME}_`),
        })
      )
    })
    expect(vi.mocked(saveFileFromBuffer).mock.calls[0][0].name).toMatch(
      /\.json$/
    )
    expect(
      vi.mocked(saveFileFromBuffer).mock.calls[0][0].buffer.byteLength
    ).toBeGreaterThan(0)
  })

  it('uses the protocol name in the filename when available', async () => {
    vi.mocked(getRun).mockResolvedValue({
      data: {
        data: {
          protocolId: 'protocol-1',
          createdAt: '2024-01-01T10:00:00.000Z',
        },
      },
    } as any)
    vi.mocked(getProtocol).mockResolvedValue({
      data: {
        data: {
          metadata: { protocolName: 'My Protocol' },
        },
      },
    } as any)

    const { result } = renderHook(() => useDownloadRunLog(ROBOT_NAME, RUN_ID), {
      wrapper,
    })

    result.current.downloadRunLog()

    await waitFor(() => {
      expect(saveFileFromBuffer).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.stringContaining('My Protocol'),
        })
      )
    })
  })
})
