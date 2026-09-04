import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
  createReasonNotRequiredDocumentationState,
  createReasonRequiredWithDocReport,
  createReasonRequiredWithoutDocReport,
} from '../__fixtures__/documentationState'
import { DocumentedMutationError } from '../types'
import { useDocumentedMutation } from '../useDocumentedMutation'

import type { AxiosError } from 'axios'
import type * as React from 'react'
import type { DocumentationReport, DocumentationState } from '../types'

const MOCK_REPORT = 'test note' as DocumentationReport

const testMutationKey = ['acm', 'useDocumentedMutation', 'test'] as const

function createAxios401Error(): AxiosError {
  return {
    isAxiosError: true,
    response: { status: 401 },
  } as AxiosError
}

describe('useDocumentedMutation', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{
      children: React.ReactNode
    }> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    wrapper = clientProvider
  })

  it('returns a working mutation when access control is on but reasonForInteractionRequired is off', async () => {
    const mutationFn = vi.fn(async (n: number) => n + 1)

    const { result } = renderHook(
      () =>
        useDocumentedMutation<number, AxiosError, number>(
          createReasonNotRequiredDocumentationState(),
          ['play_run'],
          testMutationKey,
          ({ variables: n, userNotes }) => {
            expect(userNotes).toBe('')
            return mutationFn(n)
          },
          {}
        ),
      { wrapper }
    )

    act(() => {
      result.current.mutate(5)
    })

    await waitFor(() => {
      expect(result.current.data).toBe(6)
    })
    expect(mutationFn).toHaveBeenCalledWith(5)
  })

  it('returns a working mutation when access control is disabled', async () => {
    const mutationFn = vi.fn(async (n: number) => n + 1)

    const { result } = renderHook(
      () =>
        useDocumentedMutation<number, AxiosError, number>(
          ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
          ['play_run'],
          testMutationKey,
          ({ variables: n }) => mutationFn(n),
          {}
        ),
      { wrapper }
    )

    act(() => {
      result.current.mutate(5)
    })

    await waitFor(() => {
      expect(result.current.data).toBe(6)
    })
    expect(mutationFn).toHaveBeenCalledWith(5)
  })

  it('returns a working mutation when a doc report is already present', async () => {
    const mutationFn = vi.fn(async (x: number) => x * 3)

    const { result } = renderHook(
      () =>
        useDocumentedMutation<number, AxiosError, number>(
          createReasonRequiredWithDocReport(MOCK_REPORT),
          ['play_run'],
          testMutationKey,
          ({ variables: x }) => mutationFn(x),
          {}
        ),
      { wrapper }
    )

    act(() => {
      result.current.mutate(4)
    })

    await waitFor(() => {
      expect(result.current.data).toBe(12)
    })
    expect(mutationFn).toHaveBeenCalledWith(4)
  })

  it('calls askForDocumentation when access control is on and docreport is missing', async () => {
    const askForDocumentation = vi.fn().mockResolvedValue(MOCK_REPORT)
    const mutationFn = vi.fn(async (s: string) => `${s}-ok`)

    const { result } = renderHook(
      () =>
        useDocumentedMutation<string, AxiosError, string>(
          createReasonRequiredWithoutDocReport(askForDocumentation),
          ['play_run'],
          testMutationKey,
          ({ variables: s }) => mutationFn(s),
          {}
        ),
      { wrapper }
    )

    act(() => {
      result.current.mutate('run')
    })
    await waitFor(() => {
      expect(result.current.data).toBe('run-ok')
    })
    expect(askForDocumentation).toHaveBeenCalled()
    expect(mutationFn).toHaveBeenCalledWith('run')
  })

  it('throws DocumentedMutationError when access control queries are still loading', async () => {
    const mutationFn = vi.fn(async (n: number) => n + 1)

    const { result } = renderHook(
      () =>
        useDocumentedMutation<number, DocumentedMutationError, number>(
          { isLoading: true },
          ['play_run'],
          testMutationKey,
          ({ variables: n }) => mutationFn(n),
          {}
        ),
      { wrapper }
    )

    act(() => {
      result.current.mutate(5)
    })

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(DocumentedMutationError)
    })
    expect(result.current.error).toMatchObject({
      type: 'access_control_loading',
    })
    expect(mutationFn).not.toHaveBeenCalled()
  })

  it('prompts for login but not documentation after a 401 when reason is not required', async () => {
    const askForLogin = vi.fn().mockResolvedValue({ username: 'alice' })
    const askForDocumentation = vi.fn()
    const mutationFn = vi
      .fn()
      .mockImplementationOnce(() => Promise.reject(createAxios401Error()))
      .mockImplementationOnce(({ variables }: { variables: number }) =>
        Promise.resolve(variables + 1)
      )

    const { result } = renderHook(
      () =>
        useDocumentedMutation<number, AxiosError, number>(
          {
            isLoading: false,
            accessControlEnabled: true,
            loginExpired: false,
            askForLogin,
            reasonForInteractionRequired: false,
            askForDocumentation,
          } as DocumentationState,
          ['play_run'],
          testMutationKey,
          ({ variables }) => mutationFn({ variables }),
          {}
        ),
      { wrapper }
    )

    act(() => {
      result.current.mutate(5)
    })

    await waitFor(() => {
      expect(result.current.data).toBe(6)
    })
    expect(askForLogin).toHaveBeenCalledTimes(1)
    expect(askForDocumentation).not.toHaveBeenCalled()
    expect(mutationFn).toHaveBeenCalledTimes(2)
  })

  it('propagates a null rejection without reading isAxiosError', async () => {
    const mutationFn = vi.fn().mockRejectedValue(null)

    const { result } = renderHook(
      () =>
        useDocumentedMutation<number, unknown, number>(
          createReasonNotRequiredDocumentationState(),
          ['play_run'],
          testMutationKey,
          ({ variables: n }) => mutationFn(n),
          {}
        ),
      { wrapper }
    )

    act(() => {
      result.current.mutate(5)
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(result.current.error).toBeNull()
    expect(mutationFn).toHaveBeenCalledTimes(1)
  })

  it('propagates non-401 errors without prompting for login', async () => {
    const askForLogin = vi.fn()
    const mutationFn = vi.fn().mockRejectedValue({
      isAxiosError: true,
      response: { status: 500 },
    } as AxiosError)

    const askForDocumentation = vi.fn()
    const { result } = renderHook(
      () =>
        useDocumentedMutation<number, AxiosError, number>(
          {
            isLoading: false,
            accessControlEnabled: true,
            loginExpired: false,
            askForLogin,
            reasonForInteractionRequired: true,
            docreport: MOCK_REPORT,
            askForDocumentation,
          },
          ['play_run'],
          testMutationKey,
          ({ variables: n }) => mutationFn(n),
          {}
        ),
      { wrapper }
    )

    act(() => {
      result.current.mutate(5)
    })

    await waitFor(() => {
      expect(result.current.error).toBeDefined()
    })
    expect(askForLogin).not.toHaveBeenCalled()
    expect(mutationFn).toHaveBeenCalledTimes(1)
  })

  it('does not prompt for login after a 401 when access control is disabled', async () => {
    const mutationFn = vi.fn().mockRejectedValue(createAxios401Error())

    const { result } = renderHook(
      () =>
        useDocumentedMutation<number, AxiosError, number>(
          ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
          ['play_run'],
          testMutationKey,
          ({ variables: n }) => mutationFn(n),
          {}
        ),
      { wrapper }
    )

    act(() => {
      result.current.mutate(5)
    })

    await waitFor(() => {
      expect(result.current.error).toBeDefined()
    })
    expect(mutationFn).toHaveBeenCalledTimes(1)
  })

  it('prompts for login and re-documents after a 401, then reruns the mutation', async () => {
    const askForLogin = vi.fn().mockResolvedValue({ username: 'alice' })
    const askForDocumentation = vi.fn().mockResolvedValue(MOCK_REPORT)
    const mutationFn = vi
      .fn()
      .mockImplementationOnce(() => Promise.reject(createAxios401Error()))
      .mockImplementationOnce(({ variables }: { variables: string }) =>
        Promise.resolve(`${variables}-ok`)
      )

    const { result } = renderHook(
      () =>
        useDocumentedMutation<string, AxiosError, string>(
          {
            isLoading: false,
            accessControlEnabled: true,
            loginExpired: false,
            askForLogin,
            reasonForInteractionRequired: true,
            docreport: MOCK_REPORT,
            askForDocumentation,
          },
          ['play_run'],
          testMutationKey,
          ({ variables }) => mutationFn({ variables }),
          {}
        ),
      { wrapper }
    )

    act(() => {
      result.current.mutate('run')
    })

    await waitFor(() => {
      expect(result.current.data).toBe('run-ok')
    })
    expect(askForLogin).toHaveBeenCalledTimes(1)
    expect(askForDocumentation).toHaveBeenCalledWith(
      ['play_run'],
      undefined,
      MOCK_REPORT,
      'alice'
    )
    expect(mutationFn).toHaveBeenCalledTimes(2)
  })

  it('throws when user cancels re-documentation after login', async () => {
    const askForLogin = vi.fn().mockResolvedValue({ username: 'alice' })
    const askForDocumentation = vi
      .fn()
      .mockResolvedValue('' as DocumentationReport)
    const mutationFn = vi.fn().mockRejectedValue(createAxios401Error())

    const { result } = renderHook(
      () =>
        useDocumentedMutation<number, DocumentedMutationError, number>(
          {
            isLoading: false,
            accessControlEnabled: true,
            loginExpired: false,
            askForLogin,
            reasonForInteractionRequired: true,
            docreport: MOCK_REPORT,
            askForDocumentation,
          },
          ['play_run'],
          testMutationKey,
          ({ variables: n }) => mutationFn(n),
          {}
        ),
      { wrapper }
    )

    act(() => {
      result.current.mutate(5)
    })

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(DocumentedMutationError)
    })
    expect(result.current.error).toMatchObject({
      type: 'no_documentation_report',
    })
    expect(askForLogin).toHaveBeenCalledTimes(1)
    expect(askForDocumentation).toHaveBeenCalledWith(
      ['play_run'],
      undefined,
      MOCK_REPORT,
      'alice'
    )
    expect(mutationFn).toHaveBeenCalledTimes(1)
  })

  it('throws DocumentedMutationError when documentation is required but not provided', async () => {
    const askForDocumentation = vi
      .fn()
      .mockResolvedValue('' as DocumentationReport)
    const mutationFn = vi.fn(async (n: number) => n + 1)

    const { result } = renderHook(
      () =>
        useDocumentedMutation<number, DocumentedMutationError, number>(
          createReasonRequiredWithoutDocReport(askForDocumentation),
          ['play_run'],
          testMutationKey,
          ({ variables: n }) => mutationFn(n),
          {}
        ),
      { wrapper }
    )

    act(() => {
      result.current.mutate(5)
    })

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(DocumentedMutationError)
    })
    expect(result.current.error).toMatchObject({
      type: 'no_documentation_report',
    })
    expect(mutationFn).not.toHaveBeenCalled()
  })
})
