import type {
  MutationFunction,
  MutationKey,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'

export type DocumentationReport = string & {
  readonly _brand: 'DocumentationReport'
}
/**
 * Documentation state to be passed to the useDocumentedMutation hook.
 *
 * @param accessControlEnabled - whether access control is enabled
 * @param docreport - the documentation report
 * @param askForDocumentation - a function that opens the documentation modal and returns the documentation report
 */
export type DocumentationState =
  | { accessControlEnabled: false }
  | { accessControlEnabled: true; docreport: DocumentationReport }
  | {
      accessControlEnabled: true
      docreport: null
      askForDocumentation: () => Promise<DocumentationReport>
    }

/**
 * Call signatures for useDocumentedMutation — mirrors the `useMutation`
 * shapes actually used in this codebase:
 *   (state, mutationFn, options?)
 *   (state, mutationKey, mutationFn, options?)
 */
export interface UseDocumentedMutation {
  <TData = unknown, TError = unknown, TVariables = void, TContext = unknown>(
    documentationState: DocumentationState,
    mutationFn: MutationFunction<TData, TVariables>,
    options?: UseMutationOptions<TData, TError, TVariables, TContext>
  ): UseMutationResult<TData, TError, TVariables, TContext>

  <TData = unknown, TError = unknown, TVariables = void, TContext = unknown>(
    documentationState: DocumentationState,
    mutationKey: MutationKey,
    mutationFn: MutationFunction<TData, TVariables>,
    options?: UseMutationOptions<TData, TError, TVariables, TContext>
  ): UseMutationResult<TData, TError, TVariables, TContext>
}
