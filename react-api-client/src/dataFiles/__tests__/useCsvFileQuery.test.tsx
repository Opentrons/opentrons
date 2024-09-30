import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { getCsvFile } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useCsvFileQuery } from '..'

import type {
  CsvFileData,
  CsvFileDataResponse,
  HostConfig,
  Response,
} from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const FILE_ID = 'file123'
const FILE_NAME = 'my_file.csv'
const FILE_CONTENT_RESPONSE = {
  data: {
    name: FILE_NAME,
    id: FILE_ID,
    createdAt: '2024-06-07T19:19:56.268029+00:00',
  } as CsvFileData,
} as CsvFileDataResponse

describe('useCsvFileQuery hook', () => {
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

    const { result } = renderHook(() => useCsvFileQuery(FILE_ID), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the get file request fails', () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getCsvFile).mockRejectedValue('oh no')

    const { result } = renderHook(() => useCsvFileQuery(FILE_ID), {
      wrapper,
    })
    expect(result.current.data).toBeUndefined()
  })

  it('should return file data if successful request', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getCsvFile).mockResolvedValue({
      data: FILE_CONTENT_RESPONSE,
    } as Response<CsvFileDataResponse>)

    const { result } = renderHook(() => useCsvFileQuery(FILE_ID), {
      wrapper,
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(FILE_CONTENT_RESPONSE)
    })
  })
})
