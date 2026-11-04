import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createCommand } from '@opentrons/api-client'

import { useCreateCommandMutation } from '..'
import { mockAnonLoadCommand, RUN_ID_1 } from '../__fixtures__'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '../../accessControl/__fixtures__/documentationState'
import { useHost } from '../../api'

import type * as React from 'react'
import type { HostConfig } from '@opentrons/api-client'
import type { CreateCommand } from '@opentrons/shared-data'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const MOCK_COMMAND_DATA = { id: 'command-id' }
const MOCK_MOVE_RELATIVE_COMMAND: CreateCommand = {
  commandType: 'moveRelative',
  params: {
    pipetteId: 'pipette-id',
    axis: 'x',
    distance: 0.1,
  },
}

describe('useCreateCommandMutation hook', () => {
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

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should issue the given command to the given run when callback is called', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(createCommand).mockResolvedValue({ data: 'something' } as any)

    const { result } = renderHook(
      () =>
        useCreateCommandMutation(
          ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
          [],
          () => {}
        ),
      {
        wrapper,
      }
    )

    expect(result.current.data).toBeUndefined()
    act(() => {
      result.current.createCommand({
        runId: RUN_ID_1,
        command: mockAnonLoadCommand,
      })
    })
    await waitFor(() => {
      expect(result.current.data).toBe('something')
    })
  })
  it('should pass waitUntilComplete and timeout through if given command', async () => {
    const waitUntilComplete = true
    const timeout = 2000
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(createCommand).mockResolvedValue({ data: 'something' } as any)

    const { result } = renderHook(
      () =>
        useCreateCommandMutation(
          ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
          [],
          () => {}
        ),
      {
        wrapper,
      }
    )

    expect(result.current.data).toBeUndefined()
    act(() => {
      result.current.createCommand({
        runId: RUN_ID_1,
        command: mockAnonLoadCommand,
        waitUntilComplete,
        timeout,
      })
    })
    await waitFor(() => {
      expect(result.current.data).toBe('something')
    })
  })

  it('should add non-jog commands to actions to document', async () => {
    const addActionToDocument = vi.fn()
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(createCommand).mockResolvedValue({
      data: { data: MOCK_COMMAND_DATA },
    } as any)

    const { result } = renderHook(
      () =>
        useCreateCommandMutation(
          ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
          [],
          addActionToDocument
        ),
      { wrapper }
    )

    act(() => {
      result.current.createCommand({
        runId: RUN_ID_1,
        command: mockAnonLoadCommand,
      })
    })
    await waitFor(() => {
      expect(addActionToDocument).toHaveBeenCalledWith(MOCK_COMMAND_DATA)
    })
  })

  it('should not add a moveRelative command to actions to document', async () => {
    const addActionToDocument = vi.fn()
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(createCommand).mockResolvedValue({
      data: { data: MOCK_COMMAND_DATA },
    } as any)

    const { result } = renderHook(
      () =>
        useCreateCommandMutation(
          ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
          [],
          addActionToDocument
        ),
      { wrapper }
    )

    act(() => {
      result.current.createCommand({
        runId: RUN_ID_1,
        command: MOCK_MOVE_RELATIVE_COMMAND,
      })
    })
    await waitFor(() => {
      expect(result.current.data).toEqual({ data: MOCK_COMMAND_DATA })
    })
    expect(addActionToDocument).not.toHaveBeenCalled()
  })
})
