import { useCallback } from 'react'
import { useMutation } from 'react-query'

import type {
  MutationFunction,
  MutationKey,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { DocumentationReport, DocumentationState } from './types'

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
 */
export function useDocumentedMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(
  documentationState: DocumentationState,
  mutationKey: MutationKey,
  mutationFn: MutationFunction<TData, TVariables>,
  options?: UseMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
  const wrappedMutationFn = useWrappedMutationFn(mutationFn, documentationState)
  const mutation = useMutation<TData, TError, TVariables, TContext>(
    mutationKey,
    wrappedMutationFn,
    options
  )

  return mutation
}

const checkDocumentationReport = async (
  documentationState: DocumentationState
): Promise<DocumentationReport | null> => {
  if (!documentationState.accessControlEnabled) {
    return null
  }
  if (documentationState.docreport != null) {
    return documentationState.docreport
  }
  return await documentationState.askForDocumentation()
}

function useWrappedMutationFn<TData, TVariables>(
  mutationFn: MutationFunction<TData, TVariables>,
  documentationState: DocumentationState
): MutationFunction<TData, TVariables> {
  const wrappedMutationFn = useCallback(
    async (...args: Parameters<typeof mutationFn>) => {
      const docreport = await checkDocumentationReport(documentationState)
      // TODO(jj): actually use the docreport
      console.log(docreport)
      return await mutationFn(...args)
    },
    [documentationState, mutationFn]
  )
  return wrappedMutationFn
}
