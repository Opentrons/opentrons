import { useCallback, useRef } from 'react'
import { useMutation } from 'react-query'

import { DocumentedMutationError } from './types'

import type { MutableRefObject } from 'react'
import type {
  MutationFunction,
  MutationKey,
  UseMutationOptions,
} from 'react-query'
import type {
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
 * useDocumentationState is a helper hook in /app that generates a documentation state.
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
  const mutationFn = (hasKey ? arg2 : arg1) as DocumentedMutationFunction<
    any,
    any
  >
  const options = (hasKey ? arg3 : arg2) as UseMutationOptions | undefined

  const wrappedMutationFn = useWrappedMutationFn(
    mutationFn,
    documentationState,
    actionsToDocument
  )

  return useMutation({
    ...options,
    ...(hasKey ? { mutationKey: arg1 as MutationKey } : {}),
    mutationFn: wrappedMutationFn as MutationFunction<any, any>,
  }) // Generics are getting lost here but I promise its ok
}

function useWrappedMutationFn<TData, TVariables>(
  mutationFn: DocumentedMutationFunction<TData, TVariables>,
  documentationState: DocumentationState,
  actionsToDocument:
    DocumentedAction[] | ((variables: TVariables) => DocumentedAction[])
): MutationFunction<TData, TVariables> {
  // using a ref avoids stale mutation functions after a change in the host causes a rerender
  // i.e. when the user is prompted to log in again
  const mutationFnRef = useRef(mutationFn)
  mutationFnRef.current = mutationFn

  const wrappedMutationFn = useCallback(
    async (variables: TVariables) => {
      const actionsToUse =
        typeof actionsToDocument === 'function'
          ? actionsToDocument(variables)
          : actionsToDocument
      return await runMutation(
        documentationState,
        actionsToUse,
        mutationFnRef,
        variables
      )
    },
    [actionsToDocument, documentationState]
  )
  return wrappedMutationFn
}

async function runMutation<TData, TVariables>(
  documentationState: DocumentationState,
  actionsToDocument: DocumentedAction[],
  mutationFnRef: MutableRefObject<
    DocumentedMutationFunction<TData, TVariables>
  >,
  variables: TVariables
): Promise<TData> {
  console.log('running mutation', {
    documentationState,
    actionsToDocument,
    mutationFnRef,
    variables,
  })
  if (documentationState.isLoading) {
    throw new DocumentedMutationError('access_control_loading')
  }
  if (
    documentationState.accessControlEnabled &&
    documentationState.reasonForInteractionRequired
  ) {
    // user has backed out of the documentation modal
    if (documentationState.docreport === '') {
      throw new DocumentedMutationError('no_documentation_report')
    }
    // no documentation report yet, ask for it
    if (documentationState.docreport == null) {
      const dr = await documentationState.askForDocumentation(actionsToDocument)
      return await runMutation(
        { ...documentationState, docreport: dr },
        actionsToDocument,
        mutationFnRef,
        variables
      )
    }
  }

  if (
    documentationState.accessControlEnabled &&
    documentationState.loginExpired
  ) {
    const loginResult = await documentationState.askForLogin()
    if (loginResult == null || loginResult.username.length === 0) {
      throw new DocumentedMutationError('login_cancelled')
    }

    if (documentationState.reasonForInteractionRequired) {
      const dr = await documentationState.askForDocumentation(
        actionsToDocument,
        undefined,
        documentationState.docreport ?? undefined,
        loginResult?.username
      )
      return await runMutation(
        { ...documentationState, docreport: dr, loginExpired: false },
        actionsToDocument,
        mutationFnRef,
        variables
      )
    }
  }

  return await mutationFnRef
    .current({
      variables,
      userNotes:
        documentationState.accessControlEnabled &&
        documentationState.reasonForInteractionRequired
          ? (documentationState.docreport ?? '')
          : '',
    })
    .catch(async e => {
      console.log('hit error', e)
      console.log(documentationState)
      if (
        e.isAxiosError &&
        e.response?.status === 401 &&
        documentationState.accessControlEnabled
      ) {
        console.log('hit 401')
        return await runMutation(
          { ...documentationState, loginExpired: true },
          actionsToDocument,
          mutationFnRef,
          variables
        )
      } else throw e
    })
}
