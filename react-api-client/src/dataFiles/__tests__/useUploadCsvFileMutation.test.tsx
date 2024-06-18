import * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { uploadCsvFile } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useUploadCsvFileMutation } from '../useUploadCsvFileMutation'

import type {
  HostConfig,
  UploadedCsvFileResponse,
  Response,
} from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const mockFilePath = 'media/mock-usb-drive/mock.csv'
const mockUploadResponse = {
  data: {
    id: '1',
    createdAt: '2024-06-07T19:19:56.268029+00:00',
    name: 'rtp_mock_file.csv',
  },
} as UploadedCsvFileResponse

describe('useUploadCsvFileMutation', () => {
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

    const { result } = renderHook(
      () => useUploadCsvFileMutation(mockFilePath),
      {
        wrapper,
      }
    )
    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the request fails', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(uploadCsvFile).mockRejectedValue('oh no')

    const { result } = renderHook(
      () => useUploadCsvFileMutation(mockFilePath),
      {
        wrapper,
      }
    )
    expect(result.current.data).toBeUndefined()
    result.current.uploadCsvFile(mockFilePath)
    await waitFor(() => {
      expect(result.current.data).toBeUndefined()
    })
  })

  it('should return data when calling uploadCsvFile successfully', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(uploadCsvFile).mockResolvedValue({
      data: mockUploadResponse,
    } as Response<UploadedCsvFileResponse>)

    const { result } = renderHook(
      () => useUploadCsvFileMutation(mockFilePath),
      { wrapper }
    )
    act(() => result.current.uploadCsvFile(mockFilePath))

    await waitFor(() => {
      expect(result.current.data).toEqual(mockUploadResponse)
    })
  })
})
