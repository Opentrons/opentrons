import { useMutation, useQueryClient } from 'react-query'
import { uploadCsvFile } from '@opentrons/api-client'
import { useHost } from '../api'
import type { AxiosError } from 'axios'
import type {
  UseMutationResult,
  UseMutationOptions,
  UseMutateAsyncFunction,
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
  uploadCsvFile: UseMutateAsyncFunction<
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
  options: UseUploadCsvFileMutationOption = {},
  hostOverride?: HostConfig | null
): UseUploadCsvFileMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
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
    uploadCsvFile: mutation.mutateAsync,
  }
}
