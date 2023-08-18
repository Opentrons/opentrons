import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { renderHook } from '@testing-library/react-hooks'
import { renderWithProviders } from '@opentrons/components'
import { QueryClient, QueryClientProvider } from 'react-query'
import {
  useCreateMaintenanceRunMutation,
  useCreateMaintenanceRunLabwareDefinitionMutation,
  useDeleteMaintenanceRunMutation,
  useRunQuery,
} from '@opentrons/react-api-client'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import { useMostRecentCompletedAnalysis } from '../useMostRecentCompletedAnalysis'

import { useLaunchLPC } from '../useLaunchLPC'
import { LabwarePositionCheck } from '..'

import type { LabwareOffset } from '@opentrons/api-client'
import { LabwareDefinition2 } from '@opentrons/shared-data'

jest.mock('../')
jest.mock('@opentrons/react-api-client')
jest.mock('../useMostRecentCompletedAnalysis')

const mockUseCreateMaintenanceRunMutation = useCreateMaintenanceRunMutation as jest.MockedFunction<
  typeof useCreateMaintenanceRunMutation
>
const mockUseCreateMaintenanceRunLabwareDefinitionMutation = useCreateMaintenanceRunLabwareDefinitionMutation as jest.MockedFunction<
  typeof useCreateMaintenanceRunLabwareDefinitionMutation
>
const mockUseDeleteMaintenanceRunMutation = useDeleteMaintenanceRunMutation as jest.MockedFunction<
  typeof useDeleteMaintenanceRunMutation
>
const mockUseRunQuery = useRunQuery as jest.MockedFunction<typeof useRunQuery>
const mockUseMostRecentCompletedAnalysis = useMostRecentCompletedAnalysis as jest.MockedFunction<
  typeof useMostRecentCompletedAnalysis
>
const mockLabwarePositionCheck = LabwarePositionCheck as jest.MockedFunction<
  typeof LabwarePositionCheck
>
const MOCK_RUN_ID = 'mockRunId'
const MOCK_MAINTENANCE_RUN_ID = 'mockMaintenanceRunId'
const mockCurrentOffsets: LabwareOffset[] = [
  {
    createdAt: '2022-12-20T14:06:23.562082+00:00',
    definitionUri: 'opentrons/opentrons_96_tiprack_10ul/1',
    id: 'dceac542-bca4-4313-82ba-d54a19dab204',
    location: { slotName: '2' },
    vector: { x: 1, y: 2, z: 3 },
  },
  {
    createdAt: '2022-12-20T14:06:23.562878+00:00',
    definitionUri:
      'opentrons/opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat/1',
    id: '70ae2e31-716b-4e1f-a90c-9b0dfd4d7feb',
    location: { slotName: '1', moduleModel: 'heaterShakerModuleV1' },
    vector: { x: 0, y: 0, z: 0 },
  },
]
const mockLabwareDef = fixture_tiprack_300_ul as LabwareDefinition2

describe('useLaunchLPC hook', () => {
  let wrapper: React.FunctionComponent<{}>
  let mockCreateMaintenanceRun: jest.Mock
  let mockCreateLabwareDefinition: jest.Mock
  let mockDeleteMaintenanceRun: jest.Mock

  beforeEach(() => {
    const queryClient = new QueryClient()
    mockCreateMaintenanceRun = jest.fn((_data, opts) => {
      const results = { data: { id: MOCK_MAINTENANCE_RUN_ID } }
      opts?.onSuccess(results)
      return Promise.resolve(results)
    })
    mockCreateLabwareDefinition = jest.fn(_data =>
      Promise.resolve({ data: { definitionUri: 'fakeDefUri' } })
    )
    mockDeleteMaintenanceRun = jest.fn((_data, opts) => {
      opts?.onSuccess()
    })

    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    mockLabwarePositionCheck.mockImplementation(({ onCloseClick }) => (
      <div
        onClick={() => {
          onCloseClick()
        }}
      >
        exit
      </div>
    ))
    when(mockUseRunQuery)
      .calledWith(MOCK_RUN_ID, { staleTime: Infinity })
      .mockReturnValue({
        data: {
          data: {
            labwareOffsets: mockCurrentOffsets,
          },
        },
      } as any)
    when(mockUseCreateMaintenanceRunMutation)
      .calledWith()
      .mockReturnValue({
        createMaintenanceRun: mockCreateMaintenanceRun,
      } as any)
    when(mockUseCreateMaintenanceRunLabwareDefinitionMutation)
      .calledWith()
      .mockReturnValue({
        createLabwareDefinition: mockCreateLabwareDefinition,
      } as any)
    when(mockUseDeleteMaintenanceRunMutation)
      .calledWith()
      .mockReturnValue({
        deleteMaintenanceRun: mockDeleteMaintenanceRun,
      } as any)
    when(mockUseMostRecentCompletedAnalysis)
      .calledWith(MOCK_RUN_ID)
      .mockReturnValue({
        commands: [
          {
            key: 'CommandKey0',
            commandType: 'loadLabware',
            params: {
              labwareId: 'firstLabwareId',
              location: { slotName: '1' },
              displayName: 'first labware nickname',
            },
            result: {
              labwareId: 'firstLabwareId',
              definition: mockLabwareDef,
              offset: { x: 0, y: 0, z: 0 },
            },
            id: 'CommandId0',
            status: 'succeeded',
            error: null,
            createdAt: 'fakeCreatedAtTimestamp',
            startedAt: 'fakeStartedAtTimestamp',
            completedAt: 'fakeCompletedAtTimestamp',
          },
        ],
      } as any)
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('returns and no wizard by default', () => {
    const { result } = renderHook(() => useLaunchLPC(MOCK_RUN_ID), { wrapper })
    expect(result.current.LPCWizard).toEqual(null)
  })

  it('returns creates maintenance run with current offsets and definitions when create callback is called, closes and deletes when exit is clicked', async () => {
    const { result } = renderHook(() => useLaunchLPC(MOCK_RUN_ID), { wrapper })
    await result.current.launchLPC()
    await expect(mockCreateLabwareDefinition).toHaveBeenCalledWith({
      maintenanceRunId: MOCK_MAINTENANCE_RUN_ID,
      labwareDef: mockLabwareDef,
    })
    expect(mockCreateMaintenanceRun).toHaveBeenCalledWith({
      labwareOffsets: mockCurrentOffsets.map(
        ({ vector, location, definitionUri }) => ({
          vector,
          location,
          definitionUri,
        })
      ),
    })
    expect(result.current.LPCWizard).not.toBeNull()
    const { getByText } = renderWithProviders(
      result.current.LPCWizard ?? <></>
    )[0]
    getByText('exit').click()
    expect(mockDeleteMaintenanceRun).toHaveBeenCalledWith(
      MOCK_MAINTENANCE_RUN_ID,
      {
        onSuccess: expect.any(Function),
      }
    )
    expect(result.current.LPCWizard).toBeNull()
  })
})
