import { v4 as uuidv4 } from 'uuid'
// import { POST, request } from '../request'

// import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { FileData /** UploadedCsvFileResponse */ } from './types'

// export function uploadCsvFile(
//   config: HostConfig,
//   data FileData
// ): ResponsePromise<UploadedCsvFileResponse> {
//   return request<UploadedCsvFileResponse>(
//     POST,
//     '/dataFiles',
//     null,
//     config,
//     data
//   )
// }

// ToDo (kk:06/14/2024) remove when activate the above code
export function uploadCsvFile(
  config: HostConfig,
  data: FileData
  // Note (kk: 06/14/2024) temporary using any for useUploadCsvFileMutation
): Promise<any> {
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
