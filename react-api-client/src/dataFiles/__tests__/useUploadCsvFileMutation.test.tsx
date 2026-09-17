import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { uploadCsvFile } from '@opentrons/api-client'

import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '../../accessControl/__fixtures__/documentationState'
import { useHost } from '../../api'
import { useUploadCsvFileMutation } from '../useUploadCsvFileMutation'

import type * as React from 'react'
import type {
  HostConfig,
  Response,
  UploadedCsvFileResponse,
} from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const mockFilePath = 'media/mock-usb-drive/mock.csv'
const mockFile = { name: 'my_file.csv' } as File
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
      () =>
        useUploadCsvFileMutation(ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE),
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
      () =>
        useUploadCsvFileMutation(ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE),
      {
        wrapper,
      }
    )
    expect(result.current.data).toBeUndefined()
    result.current.uploadCsvFile(mockFilePath).catch(_ => {})
    await waitFor(() => {
      expect(result.current.data).toBeUndefined()
    })
    await waitFor(() => {
      expect(result.current.error).toBe('oh no')
    })
  })

  it('should return data when calling uploadCsvFile with filePath successfully', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(uploadCsvFile).mockResolvedValue({
      data: mockUploadResponse,
    } as Response<UploadedCsvFileResponse>)

    const { result } = renderHook(
      () =>
        useUploadCsvFileMutation(ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE),
      { wrapper }
    )
    await waitFor(() => result.current.uploadCsvFile(mockFilePath))

    await waitFor(() => {
      expect(result.current.data).toEqual(mockUploadResponse)
    })
  })

  it('should return data when calling uploadCsvFile with file successfully', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(uploadCsvFile).mockResolvedValue({
      data: mockUploadResponse,
    } as Response<UploadedCsvFileResponse>)

    const { result } = renderHook(
      () =>
        useUploadCsvFileMutation(ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE),
      { wrapper }
    )
    await waitFor(() => result.current.uploadCsvFile(mockFile))

    await waitFor(() => {
      expect(result.current.data).toEqual(mockUploadResponse)
    })
  })
})
