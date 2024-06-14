import { v4 as uuidv4 } from 'uuid'
// import { POST, request } from '../request'

// import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { UploadCsvFileParams, UploadCsvFileResponse } from './types'

/** 
 * 
 * When be is ready
 * 
export function uploadCsvFile(
  config: HostConfig,
  params: UploadCsvFileParams
): ResponsePromise<UploadCsvFileResponse> {
  return request<UploadCsvFileResponse>(POST, '/dataFiles', null, config, params)
}
*/

// ToDo (kk:06/14/2024) remove when activate the above code
export function uploadCsvFile(
  config: HostConfig,
  params: UploadCsvFileParams
): Promise<UploadCsvFileResponse> {
  const fileId = uuidv4()
  const stub = {
    data: {
      id: fileId,
      createdAt: '2024-06-07T19:19:56.268029+00:00',
      name: 'rtp_mock_file.csv',
    },
  }
  return Promise.resolve(stub)
}
