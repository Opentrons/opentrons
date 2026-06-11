import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDocumentedMutation } from '../useDocumentedMutation'

import type { AxiosError } from 'axios'
import type * as React from 'react'
import type { DocumentationReport } from '../types'

const MOCK_REPORT = 'test note' as DocumentationReport

const testMutationKey = ['acm', 'useDocumentedMutation', 'test'] as const

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

  it('returns a working mutation when access control is disabled', async () => {
    const mutationFn = vi.fn(async (n: number) => n + 1)

    const { result } = renderHook(
      () =>
        useDocumentedMutation<number, AxiosError, number>(
          { reasonForInteractionRequired: false },
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
          {
            reasonForInteractionRequired: true,
            docreport: MOCK_REPORT,
          },
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
          {
            reasonForInteractionRequired: true,
            docreport: null,
            askForDocumentation,
          },
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
  })

  it('still exposes a working mutation when askForDocumentation is triggered', async () => {
    const askForDocumentation = vi.fn().mockResolvedValue(MOCK_REPORT)
    const mutationFn = vi.fn(async (s: string) => `${s}-ok`)

    const { result } = renderHook(
      () =>
        useDocumentedMutation<string, AxiosError, string>(
          {
            reasonForInteractionRequired: true,
            docreport: null,
            askForDocumentation,
          },
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
    expect(mutationFn).toHaveBeenCalledWith('run')
  })
})
