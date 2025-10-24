import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getDataFileRaw } from '@opentrons/api-client'

import { useDataFileRawQuery } from '..'
import { useHost } from '../../api'

import type * as React from 'react'
import type {
  DownloadedDataFileResponse,
  HostConfig,
  Response,
} from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const FILE_ID = 'file123'
const FILE_CONTENT_RESPONSE =
  'content,of,my,csv\nfile,' as DownloadedDataFileResponse

describe('useDataFileRawQuery hook', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{
      children: React.ReactNode
    }> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    wrapper = clientProvider
  })

  it('should return no data if no host', () => {
    vi.mocked(useHost).mockReturnValue(null)

    const { result } = renderHook(() => useDataFileRawQuery(FILE_ID), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the get file request fails', () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getDataFileRaw).mockRejectedValue('oh no')

    const { result } = renderHook(() => useDataFileRawQuery(FILE_ID), {
      wrapper,
    })
    expect(result.current.data).toBeUndefined()
  })

  it('should return file data if successful request', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getDataFileRaw).mockResolvedValue({
      data: FILE_CONTENT_RESPONSE,
    } as Response<DownloadedDataFileResponse>)

    const { result } = renderHook(() => useDataFileRawQuery(FILE_ID), {
      wrapper,
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(FILE_CONTENT_RESPONSE)
    })
  })
})
