import { useQueryClient } from 'react-query'

import { uploadCsvFile } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateAsyncFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  ErrorResponse,
  FileData,
  HostConfig,
  UploadedCsvFileResponse,
} from '@opentrons/api-client'
import type { DocumentationState } from '../accessControl'
import type { DocumentedMutationParameters } from '../accessControl/types'

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
  documentationState: DocumentationState,
  options: UseUploadCsvFileMutationOption = {},
  hostOverride?: HostConfig | null
): UseUploadCsvFileMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const queryClient = useQueryClient()

  const mutation = useDocumentedMutation<
    UploadedCsvFileResponse,
    AxiosError<ErrorResponse>,
    FileData
  >(
    documentationState,
    ['upload_csv'],
    getQueryKey(host, 'dataFiles'),
    ({
      variables: fileData,
      userNotes,
    }: DocumentedMutationParameters<FileData>) =>
      uploadCsvFile(host!, fileData, userNotes).then(response => {
        queryClient
          .invalidateQueries(getQueryKey(host, 'dataFiles'))
          .then(() =>
            queryClient.setQueryData(
              getQueryKey(host, 'dataFiles', response.data.data.id),
              response.data
            )
          )
          .catch((e: Error) => {
            console.error(`error invalidating data files query: ${e.message}`)
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
