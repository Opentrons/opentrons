import { postLogMessage } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { getQueryKey, useHost } from '../api'

import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  PostLogMessageData,
  PostLogMessageResponse,
} from '@opentrons/api-client'
import type { DocumentationState, DocumentedAction } from '../accessControl'
import type { DocumentedMutationParameters } from '../accessControl/types'

export type UsePostLogMessageMutationResult = UseMutationResult<
  PostLogMessageResponse,
  unknown,
  PostLogMessageData
> & {
  postLogMessage: UseMutateFunction<
    PostLogMessageResponse,
    unknown,
    PostLogMessageData
  >
}

export type UsePostLogMessageMutationOptions = UseMutationOptions<
  PostLogMessageResponse,
  unknown,
  PostLogMessageData
>

export function usePostLogMessageMutation(
  documentationState: DocumentationState,
  action: DocumentedAction,
  options: UsePostLogMessageMutationOptions = {}
): UsePostLogMessageMutationResult {
  const host = useHost()

  const mutation = useDocumentedMutation<
    PostLogMessageResponse,
    unknown,
    PostLogMessageData
  >(
    documentationState,
    [action],
    getQueryKey(host, 'audit', 'logMessage'),
    ({
      variables,
      userNotes,
    }: DocumentedMutationParameters<PostLogMessageData>) =>
      postLogMessage(host!, variables, userNotes).then(
        response => response.data
      ),
    options
  )

  return {
    ...mutation,
    postLogMessage: mutation.mutate,
  }
}
