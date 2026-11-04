import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createRunAction } from '@opentrons/api-client'

import { useResumeRunFromRecoveryAssumingFalsePositiveMutation } from '..'
import { mockResumeFromRecoveryAction, RUN_ID_1 } from '../__fixtures__'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '../../accessControl/__fixtures__/documentationState'
import { useHost } from '../../api'

import type * as React from 'react'
import type { HostConfig, Response, RunAction } from '@opentrons/api-client'
import type { UseResumeRunFromRecoveryAssumingFalsePositiveMutationOptions } from '../useResumeFromRecoveryAssumingFalsePositiveMutation'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }

describe('useResumeRunFromRecoveryAssumingFalsePositiveMutation hook', () => {
  let wrapper: React.FunctionComponent<
    {
      children: React.ReactNode
    } & UseResumeRunFromRecoveryAssumingFalsePositiveMutationOptions
  >

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<
      {
        children: React.ReactNode
      } & UseResumeRunFromRecoveryAssumingFalsePositiveMutationOptions
    > = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    wrapper = clientProvider
  })

  it('should return no data when calling resumeRunFromRecoveryAssumingFalsePositive if the request fails', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(createRunAction).mockRejectedValue('oh no')

    const { result } = renderHook(
      () =>
        useResumeRunFromRecoveryAssumingFalsePositiveMutation(
          ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE
        ),
      { wrapper }
    )

    expect(result.current.data).toBeUndefined()
    act(() =>
      result.current.resumeRunFromRecoveryAssumingFalsePositive(RUN_ID_1)
    )
    await waitFor(() => {
      expect(result.current.data).toBeUndefined()
    })
  })

  it('should create a resumeFromRecoveryAssumingFalsePositive run action when calling the resumeRunFromRecoveryAssumingFalsePositive callback', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(createRunAction).mockResolvedValue({
      data: mockResumeFromRecoveryAction,
    } as Response<RunAction>)

    const { result } = renderHook(
      () =>
        useResumeRunFromRecoveryAssumingFalsePositiveMutation(
          ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE
        ),
      { wrapper }
    )
    act(() =>
      result.current.resumeRunFromRecoveryAssumingFalsePositive(RUN_ID_1)
    )

    await waitFor(() => {
      expect(result.current.data).toEqual(mockResumeFromRecoveryAction)
    })
  })
})
