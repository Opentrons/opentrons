import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getImageFiles } from '@opentrons/api-client'

import { useImageFileQuery } from '..'
import { useHost } from '../../api'

import type * as React from 'react'
import type {
  HostConfig,
  ImageFileData,
  ImageFilesDataResponse,
  Response,
} from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const RUN_ID = 'run123'
const IMAGE_ID = 'file123'
const CAMERA_ID = 'camera123'
const COMMAND_ID = 'commandId123'
const PREV_COMMAND_ID = 'prevCommandId123'
const FILE_CONTENT_RESPONSE = {
  data: [
    {
      id: IMAGE_ID,
      cameraId: CAMERA_ID,
      commandId: COMMAND_ID,
      prevCommandId: PREV_COMMAND_ID,
      createdAt: '2024-06-07T19:19:56.268029+00:00',
    },
  ] as ImageFileData[],
} as ImageFilesDataResponse

describe('useDataFileQuery hook', () => {
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

    const { result } = renderHook(() => useImageFileQuery(RUN_ID), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the get file request fails', () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getImageFiles).mockRejectedValue('oh no')

    const { result } = renderHook(() => useImageFileQuery(RUN_ID), {
      wrapper,
    })
    expect(result.current.data).toBeUndefined()
  })

  it('should return image file data if successful request', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getImageFiles).mockResolvedValue({
      data: FILE_CONTENT_RESPONSE,
    } as Response<ImageFilesDataResponse>)

    const { result } = renderHook(() => useImageFileQuery(RUN_ID), {
      wrapper,
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(FILE_CONTENT_RESPONSE)
    })
  })
})
