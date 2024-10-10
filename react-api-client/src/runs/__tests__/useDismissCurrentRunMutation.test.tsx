import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { dismissCurrentRun } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useDismissCurrentRunMutation } from '..'

import { RUN_ID_1 } from '../__fixtures__'

import type { HostConfig } from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }

describe('useDismissCurrentRunMutation hook', () => {
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

  it('should dismiss the current run when callback is called', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(dismissCurrentRun).mockResolvedValue({ data: 'something' } as any)

    const { result } = renderHook(() => useDismissCurrentRunMutation(), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
    act(() => {
      result.current.dismissCurrentRun(RUN_ID_1)
    })
    await waitFor(() => {
      expect(result.current.data).toBe('something')
    })
  })
})
