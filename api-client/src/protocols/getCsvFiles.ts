// import { GET, request } from '../request'

// import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { UploadedCsvFilesResponse } from '../dataFiles/types'

/**
export function getCsvFiles(
  config: HostConfig,
  protocolId: string
): ResponsePromise<UploadCsvFilesResponse> {
  return request<UploadCsvFilesResponse>(
    GET,
    `/protocols/${protocolId}/dataFiles`,
    null,
    config
  )
}
   */

// ToDo (kk:06/14/2024) remove when activate the above code
export function getCsvFiles(
  config: HostConfig,
  protocolId: string
): Promise<{ data: UploadedCsvFilesResponse }> {
  const stub = {
    data: {
      files: [
        {
          id: '1',
          createdAt: '2024-06-07T19:19:56.268029+00:00',
          name: 'rtp_mock_file1.csv',
        },
        {
          id: '2',
          createdAt: '2024-06-17T19:19:56.268029+00:00',
          name: 'rtp_mock_file2.csv',
        },
      ],
    },
  }
  return Promise.resolve({ data: stub })
}
