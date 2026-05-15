import { useMutation } from 'react-query'

import {
  type DocumentationState,
  type DocumentedMutationProps,
  type DocumentedMutationReturnType,
} from './types'

/**
 * Wrapper for a mutation function the ensure documentation is provided in ACM.
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
  ...props: DocumentedMutationProps<TData, TError, TVariables, TContext>
): DocumentedMutationReturnType<TData, TError, TVariables, TContext> {
  if (documentationState.accessControlEnabled) {
    if (documentationState.docreport == null) {
      // TODO(jj): this function is async...hmmm
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const docreport = documentationState.askForDocumentation()
    }
  }

  const mutation = useMutation<TData, TError, TVariables, TContext>(...props)

  return mutation
}
