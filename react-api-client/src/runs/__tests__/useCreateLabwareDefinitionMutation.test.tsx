import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createLabwareDefinition } from '@opentrons/api-client'
import { useHost } from '../../api'

import { useCreateLabwareDefinitionMutation } from '../useCreateLabwareDefinitionMutation'
import type { HostConfig } from '@opentrons/api-client'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const RUN_ID = 'run_id'

describe('useCreateLabwareDefinitionMutation hook', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>
  let labwareDefinition: LabwareDefinition2

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{
      children: React.ReactNode
    }> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    wrapper = clientProvider
    labwareDefinition = {} as any
  })

  it('should create labware offsets when callback is called', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(createLabwareDefinition).mockResolvedValue({
      data: 'created labware definition!',
    } as any)

    const { result } = renderHook(useCreateLabwareDefinitionMutation, {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
    act(() => {
      result.current.createLabwareDefinition({
        runId: RUN_ID,
        data: labwareDefinition,
      })
    })
    await waitFor(() => {
      expect(result.current.data).toBe('created labware definition!')
    })
  })
})
