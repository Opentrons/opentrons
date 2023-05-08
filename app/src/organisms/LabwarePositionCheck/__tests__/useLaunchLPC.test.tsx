import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { renderHook } from '@testing-library/react-hooks'
import { renderWithProviders } from '@opentrons/components'
import { QueryClient, QueryClientProvider } from 'react-query'
import {
  useCreateMaintenanceRunMutation,
  useDeleteMaintenanceRunMutation,
  useRunQuery,
} from '@opentrons/react-api-client'
import { useMostRecentCompletedAnalysis } from '../useMostRecentCompletedAnalysis'

import { useLaunchLPC } from '../useLaunchLPC'
import { LabwarePositionCheck } from '..'

jest.mock('../')
jest.mock('@opentrons/react-api-client')
jest.mock('../useMostRecentCompletedAnalysis')

const mockUseCreateMaintenanceRunMutation = useCreateMaintenanceRunMutation as jest.MockedFunction<
  typeof useCreateMaintenanceRunMutation
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

describe('useLaunchLPC hook', () => {
  let wrapper: React.FunctionComponent<{}>
  let mockCreateMaintenanceRun: jest.Mock
  let mockDeleteMaintenanceRun: jest.Mock

  beforeEach(() => {
    const queryClient = new QueryClient()
    mockCreateMaintenanceRun = jest.fn((_data, opts) => {
      opts?.onSuccess({ data: { id: MOCK_MAINTENANCE_RUN_ID } })
    })
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
      .mockReturnValue({ data: {} } as any)
    when(mockUseCreateMaintenanceRunMutation)
      .calledWith()
      .mockReturnValue({
        createMaintenanceRun: mockCreateMaintenanceRun,
      } as any)
    when(mockUseDeleteMaintenanceRunMutation)
      .calledWith()
      .mockReturnValue({
        deleteMaintenanceRun: mockDeleteMaintenanceRun,
      } as any)
    when(mockUseMostRecentCompletedAnalysis)
      .calledWith(MOCK_RUN_ID)
      .mockReturnValue({} as any)
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('returns and no wizard by default', () => {
    const { result } = renderHook(() => useLaunchLPC(MOCK_RUN_ID), { wrapper })
    expect(result.current.LPCWizard).toEqual(null)
  })

  it('returns creates maintenance run when create callback is called, closes and deletes when exit is clicked', () => {
    const { result } = renderHook(() => useLaunchLPC(MOCK_RUN_ID), { wrapper })
    result.current.launchLPC()
    expect(mockCreateMaintenanceRun).toHaveBeenCalledWith(
      {},
      { onSuccess: expect.any(Function) }
    )
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
