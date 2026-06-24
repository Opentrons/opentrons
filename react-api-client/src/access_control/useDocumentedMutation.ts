import { useCallback } from 'react'
import { useMutation } from 'react-query'

import type {
  MutationFunction,
  MutationKey,
  UseMutationOptions,
} from 'react-query'
import type {
  DocumentationReport,
  DocumentationState,
  DocumentedAction,
  DocumentedMutationFunction,
  UseDocumentedMutation,
} from './types'

/**
 * Wrapper for a mutation function that ensures documentation is provided when access control is enabled.
 * In the future, all mutations should use this hook.
 *
 * When using a mutation, your options are to either prompt for the documentation separately and pass it into the hook,
 * or to provide a callback that will pop up the documentation modal directly.
 *
 * The first option is to be used in flows where multiple mutations occur in sequence and no popup is desired in between.
 * Implementing tracking the documentation state across these mutations is left as an exercise for, well, me in the future probably.
 *
 * The second option is to be used for one-off mutations where a popup is desired. i.e. playing pausing or canceling a run.
 *
 * useGuardedAction is a helper hook in /app that generates a documentation state.
 *
 * TODO(jj): actually pass along the documentation report to the mutation.
 *
 * Call signatures live in ./types as `UseDocumentedMutation`.
 */
export const useDocumentedMutation: UseDocumentedMutation = (
  documentationState,
  actionsToDocument,
  arg1,
  arg2?,
  arg3?
) => {
  const hasKey = typeof arg1 !== 'function'
  const mutationFn = (hasKey ? arg2 : arg1) as DocumentedMutationFunction
  const options = (hasKey ? arg3 : arg2) as UseMutationOptions | undefined

  const wrappedMutationFn = useWrappedMutationFn(
    mutationFn,
    documentationState,
    actionsToDocument
  )

  return useMutation({
    ...options,
    ...(hasKey ? { mutationKey: arg1 as MutationKey } : {}),
    mutationFn: wrappedMutationFn,
  })
}

const checkDocumentationReport = async (
  documentationState: DocumentationState,
  actionsToDocument: DocumentedAction[]
): Promise<DocumentationReport | null> => {
  if (
    documentationState.isLoading ||
    !documentationState.reasonForInteractionRequired
  ) {
    return null
  }
  if (documentationState.docreport != null) {
    return documentationState.docreport
  }
  return await documentationState.askForDocumentation(actionsToDocument)
}

function useWrappedMutationFn<TData, TVariables>(
  mutationFn: DocumentedMutationFunction<TData, TVariables>,
  documentationState: DocumentationState,
  actionsToDocument: DocumentedAction[]
): MutationFunction<TData, TVariables> {
  const wrappedMutationFn = useCallback(
    async (variables: TVariables) => {
      const docreport = await checkDocumentationReport(
        documentationState,
        actionsToDocument
      )
      if (docreport == null) {
        console.error('No documentation report provided')
      }
      if (documentationState.isLoading) {
        throw new Error('Access control queries are still loading')
      }
      return await mutationFn({ variables, userNotes: docreport ?? '' })
    },
    [actionsToDocument, documentationState, mutationFn]
  )
  return wrappedMutationFn
}
