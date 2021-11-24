import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook } from '@testing-library/react-hooks'
import { createLabwareOffsets } from '@opentrons/api-client'
import { useHost } from '../../api'

import { useCreateLabwareOffsetsMutation } from '../useCreateLabwareOffsetsMutation'

import type { HostConfig } from '@opentrons/api-client'
import type { CreateLabwareOffsetsData } from '@opentrons/api-client/src/runs/createLabwareOffsets'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const mockCreateLabwareOffsets = createLabwareOffsets as jest.MockedFunction<
  typeof createLabwareOffsets
>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const RUN_ID = 'run_id'
const DEFINITION_URI = 'definition_uri'
const LABWARE_LOCATION = { slotName: '4' }
const OFFSET = { x: 1, y: 2, z: 3 }

describe('useCreateCommandMutation hook', () => {
  let wrapper: React.FunctionComponent<{}>
  let createLabwareOffsetsData: CreateLabwareOffsetsData

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{}> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    wrapper = clientProvider
    createLabwareOffsetsData = {
      labwareOffsets: [
        {
          definitionUri: DEFINITION_URI,
          location: LABWARE_LOCATION,
          offset: OFFSET,
        },
      ],
    }
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should create labware offsets when callback is called', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockCreateLabwareOffsets)
      .calledWith(HOST_CONFIG, RUN_ID, createLabwareOffsetsData)
      .mockResolvedValue({ data: 'created offsets!' } as any)

    const { result, waitFor } = renderHook(useCreateLabwareOffsetsMutation, {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
    act(() => {
      result.current.createLabwareOffsets({
        runId: RUN_ID,
        data: createLabwareOffsetsData,
      })
    })
    await waitFor(() => {
      return result.current.data != null
    })
    expect(result.current.data).toBe('created offsets!')
  })
})
