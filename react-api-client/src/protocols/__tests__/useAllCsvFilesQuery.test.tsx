import * as React from 'react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook /** waitFor */ } from '@testing-library/react'
// import { getCsvFiles } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useAllCsvFilesQuery } from '../useAllCsvFilesQuery'

// import type {
//   HostConfig,
//   Response,
//   UploadedCsvFilesResponse,
// } from '@opentrons/api-client'

vi.mock('@oopentrons/api-client')
vi.mock('../../api/useHost')

// const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
// const CSV_FILES_RESPONSE = {
//   data: {
//     files: [
//       {
//         id: '1',
//         createdAt: '2024-06-07T19:19:56.268029+00:00',
//         name: 'rtp_mock_file1.csv',
//       },
//       {
//         id: '2',
//         createdAt: '2024-06-17T19:19:56.268029+00:00',
//         name: 'rtp_mock_file2.csv',
//       },
//     ],
//   },
// } as UploadedCsvFilesResponse
const PROTOCOL_ID = '1'

describe('useAllCsvFilesQuery', () => {
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

    const { result } = renderHook(() => useAllCsvFilesQuery(PROTOCOL_ID), {
      wrapper,
    })
    expect(result.current.data).toBeUndefined()
  })

  //   ToDo (kk:06/14/2024) remove comment when remove stub
  //   it('should return no data if the get csv files request fails', () => {
  //     vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
  //     vi.mocked(getCsvFiles).mockRejectedValue('oh no')

  //     const { result } = renderHook(() => useAllCsvFilesQuery(PROTOCOL_ID), {
  //       wrapper,
  //     })

  //     expect(result.current.data).toBeUndefined()
  //   })

  //   it('should return csv files data', async () => {
  //     vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
  //     vi.mocked(getCsvFiles).mockResolvedValue({
  //       data: CSV_FILES_RESPONSE,
  //     } as Response<UploadedCsvFilesResponse>)

  //     const { result } = renderHook(() => useAllCsvFilesQuery(PROTOCOL_ID), {
  //       wrapper,
  //     })

  //     await waitFor(() => {
  //       expect(result.current.data).toEqual(CSV_FILES_RESPONSE)
  //     })
  //   })
})
