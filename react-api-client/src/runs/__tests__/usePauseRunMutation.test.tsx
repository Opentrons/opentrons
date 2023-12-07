import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createRunAction, RUN_ACTION_TYPE_PAUSE } from '@opentrons/api-client'
import { useHost } from '../../api'
import { usePauseRunMutation } from '..'

import { RUN_ID_1, mockPauseRunAction } from '../__fixtures__'

import type { HostConfig, Response, RunAction } from '@opentrons/api-client'
import type { UsePauseRunMutationOptions } from '../usePauseRunMutation'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockCreateRunAction = createRunAction as jest.MockedFunction<
  typeof createRunAction
>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }

describe('usePauseRunMutation hook', () => {
  let wrapper: React.FunctionComponent<{children: React.ReactNode} & UsePauseRunMutationOptions>
  const createPauseRunActionData = { actionType: RUN_ACTION_TYPE_PAUSE }

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{children: React.ReactNode} & UsePauseRunMutationOptions> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    wrapper = clientProvider
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return no data when calling pauseRun if the request fails', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockCreateRunAction)
      .calledWith(HOST_CONFIG, RUN_ID_1, createPauseRunActionData)
      .mockRejectedValue('uh oh')

    const { result } = renderHook(usePauseRunMutation, {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
    act(() => result.current.pauseRun(RUN_ID_1))
    await waitFor(() => {
      expect(result.current.data).toBeUndefined()
    })
  })

  it('should create a pause run action when calling the pauseRun callback', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockCreateRunAction)
      .calledWith(HOST_CONFIG, RUN_ID_1, createPauseRunActionData)
      .mockResolvedValue({ data: mockPauseRunAction } as Response<RunAction>)

    const { result } = renderHook(usePauseRunMutation, {
      wrapper,
    })
    act(() => result.current.pauseRun(RUN_ID_1))

    await waitFor(() => {
      expect(result.current.data).toEqual(mockPauseRunAction)
    })
  })
})
