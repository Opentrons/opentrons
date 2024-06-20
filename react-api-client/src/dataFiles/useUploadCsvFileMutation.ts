import { useMutation, useQueryClient } from 'react-query'
import { uploadCsvFile } from '@opentrons/api-client'
import { useHost } from '../api'
import type { AxiosError } from 'axios'
import type {
  UseMutationResult,
  UseMutationOptions,
  UseMutateFunction,
} from 'react-query'
import type {
  ErrorResponse,
  HostConfig,
  FileData,
  UploadedCsvFileResponse,
} from '@opentrons/api-client'

export type UseUploadCsvFileMutationResult = UseMutationResult<
  UploadedCsvFileResponse,
  AxiosError<ErrorResponse>,
  FileData
> & {
  uploadCsvFile: UseMutateFunction<
    UploadedCsvFileResponse,
    AxiosError<ErrorResponse>,
    FileData
  >
}

export type UseUploadCsvFileMutationOption = UseMutationOptions<
  UploadedCsvFileResponse,
  AxiosError<ErrorResponse>,
  FileData
>

export function useUploadCsvFileMutation(
  fileData: FileData,
  options: UseUploadCsvFileMutationOption = {},
  hostOverride?: HostConfig | null
): UseUploadCsvFileMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<
    UploadedCsvFileResponse,
    AxiosError<ErrorResponse>,
    FileData
  >(
    (fileData: FileData) =>
      uploadCsvFile(host as HostConfig, fileData).then(response => {
        queryClient
          .invalidateQueries([host, 'dataFiles'])
          .then(() =>
            queryClient.setQueryData([host, 'dataFiles'], response.data)
          )
          .catch((e: Error) => {
            throw e
          })
        return response.data
      }),
    options
  )
  return {
    ...mutation,
    uploadCsvFile: mutation.mutate,
  }
}
