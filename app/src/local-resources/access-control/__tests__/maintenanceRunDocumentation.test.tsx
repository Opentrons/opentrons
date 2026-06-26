import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createMaintenanceCommand,
  createMaintenanceRun,
  deleteMaintenanceRun,
} from '@opentrons/api-client'
import {
  useAccessControlEnabledQuery,
  useAuthSettingsQuery,
  useCreateMaintenanceCommandMutation,
  useCreateMaintenanceRunMutation,
  useDeleteMaintenanceRunMutation,
  useHost,
} from '@opentrons/react-api-client'

import { useMaintenanceRunDocumentation } from '../useMaintenanceRunDocumentation'
import {
  mockShowDocumentationRequiredModal,
  wrapWithDocumentationRequiredModal,
} from './documentationRequiredModalTestUtils'

import type { FunctionComponent, ReactNode } from 'react'
import type ReactRedux from 'react-redux'
import type * as ApiClient from '@opentrons/api-client'
import type * as ReactApiClient from '@opentrons/react-api-client'

/**
 * Integration test to ensure that maintenance runs prompt for interaction reasons correctly.
 *
 * 1) On launch the user is prompted exactly once for documentation, and
 *    the resulting report is stored and passed into the createRun mutation.
 * 2) Every step of the maintenance run executes against the same
 *    captured documentation report — running the mutations must NOT trigger any
 *    additional prompts.
 * 3) The delete run mutation prompts the user for documentation again and passes the report into the mutation.
 */

vi.mock('@opentrons/react-api-client', async importOriginal => {
  const actual = await importOriginal<typeof ReactApiClient>()
  return {
    ...actual,
    useAuthSettingsQuery: vi.fn(),
    useAccessControlEnabledQuery: vi.fn(),
    useHost: vi.fn(),
  }
})

vi.mock('@opentrons/api-client', async importOriginal => {
  const actual = await importOriginal<typeof ApiClient>()
  return {
    ...actual,
    createMaintenanceRun: vi.fn(),
    createMaintenanceCommand: vi.fn(),
    deleteMaintenanceRun: vi.fn(),
  }
})

vi.mock('react-redux', async importOriginal => {
  const actual = await importOriginal<typeof ReactRedux>()

  return {
    ...actual,
    useSelector: (selector: (state: unknown) => unknown) => selector({}),
  }
})

vi.mock('/app/redux/robot-auth', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...(actual as any),
    useCurrentUsername: vi.fn(() => 'alice'),
    useCurrentRobotName: vi.fn(() => 'otie'),
  }
})

const HOST_CONFIG: ApiClient.HostConfig = { hostname: 'localhost' }
const MAINTENANCE_RUN_ID = 'maintenance-run-1'

const MOCK_DOCREPORT: ReactApiClient.DocumentationReport =
  'starting pipette attach for QC' as ReactApiClient.DocumentationReport

/**
 * Simulates the lifecycle of a real maintenance run by composing the same
 * mutation hooks the production wizards use (e.g. PipetteWizardFlows):
 *  - `commandDocState` auto-prompts on mount and gates the create-run and
 *    in-run commands.
 *  - `deletionDocState` gates teardown and prompts on demand when the
 *    delete mutation runs.
 */
const useFakeMaintenanceRun = (): {
  commandDocState: ReturnType<
    typeof useMaintenanceRunDocumentation
  >['commandDocState']
  deletionDocState: ReturnType<
    typeof useMaintenanceRunDocumentation
  >['deletionDocState']
  createRun: ReturnType<typeof useCreateMaintenanceRunMutation>
  homeCommand: ReturnType<typeof useCreateMaintenanceCommandMutation>
  moveCommand: ReturnType<typeof useCreateMaintenanceCommandMutation>
  deleteRun: ReturnType<typeof useDeleteMaintenanceRunMutation>
} => {
  const {
    commandDocState,
    deletionDocState,
    actionsToDocument,
    addActionToDocument,
  } = useMaintenanceRunDocumentation('lpc_flow')

  const createRun = useCreateMaintenanceRunMutation(
    commandDocState,
    actionsToDocument
  )
  const homeCommand = useCreateMaintenanceCommandMutation(
    commandDocState,
    actionsToDocument,
    addActionToDocument
  )
  const moveCommand = useCreateMaintenanceCommandMutation(
    commandDocState,
    actionsToDocument,
    addActionToDocument
  )
  const deleteRun = useDeleteMaintenanceRunMutation(
    deletionDocState,
    actionsToDocument
  )

  return {
    commandDocState,
    deletionDocState,
    createRun,
    homeCommand,
    moveCommand,
    deleteRun,
  }
}

describe('maintenance run documentation flow', () => {
  let wrapper: FunctionComponent<{ children: ReactNode }>

  beforeEach(() => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(useAuthSettingsQuery).mockReturnValue({
      data: {
        data: {
          requireReasonForInteraction: true,
          minLengthOfReasonForInteraction: 10,
        },
      },
    } as ReturnType<typeof useAuthSettingsQuery>)
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: {
        data: {
          accessControlEnabled: true,
        },
      },
    } as ReturnType<typeof useAccessControlEnabledQuery>)
    vi.mocked(mockShowDocumentationRequiredModal).mockResolvedValue(
      MOCK_DOCREPORT
    )
    vi.mocked(createMaintenanceRun).mockResolvedValue({
      data: { data: { id: MAINTENANCE_RUN_ID } },
    } as any)
    vi.mocked(createMaintenanceCommand).mockResolvedValue({
      data: { data: { id: 'command-id' } },
    } as any)
    vi.mocked(deleteMaintenanceRun).mockResolvedValue({ data: {} } as any)

    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    })
    wrapper = wrapWithDocumentationRequiredModal(({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ))
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('prompts at launch, shares the report across all steps, and re-prompts at end', async () => {
    const { result } = renderHook(() => useFakeMaintenanceRun(), { wrapper })

    // 1) On launch the user is prompted exactly once for documentation, and
    //    the resulting report is bound to the commandDocState used by every
    //    in-run command.
    await waitFor(() => {
      expect(mockShowDocumentationRequiredModal).toHaveBeenCalledTimes(1)
    })
    await waitFor(() => {
      expect(
        !result.current.commandDocState.isLoading &&
          result.current.commandDocState.reasonForInteractionRequired &&
          result.current.commandDocState.docreport
      ).toEqual(MOCK_DOCREPORT)
    })

    const { deletionDocState } = result.current

    // The deletion gate is in place but has NOT prompted yet — it is set up
    // to prompt only when the deletion mutation actually runs.
    expect(
      !deletionDocState.isLoading &&
        deletionDocState.reasonForInteractionRequired
    ).toBe(true)
    expect(
      !deletionDocState.isLoading &&
        deletionDocState.reasonForInteractionRequired &&
        deletionDocState.docreport
    ).toBeNull()
    expect(
      !deletionDocState.isLoading &&
        deletionDocState.reasonForInteractionRequired &&
        deletionDocState.docreport == null &&
        deletionDocState.askForDocumentation
    ).toBeDefined()

    // 2) Every step of the maintenance run executes against the same
    //    captured documentation report — running them must NOT trigger any
    //    additional prompts.
    await act(async () => {
      await result.current.createRun.createMaintenanceRun({})
    })
    await act(async () => {
      await result.current.homeCommand.createMaintenanceCommand({
        maintenanceRunId: MAINTENANCE_RUN_ID,
        command: { commandType: 'home', params: {} },
      })
    })
    await act(async () => {
      await result.current.moveCommand.createMaintenanceCommand({
        maintenanceRunId: MAINTENANCE_RUN_ID,
        command: { commandType: 'home', params: {} },
      })
    })

    expect(createMaintenanceRun).toHaveBeenCalledTimes(1)
    expect(createMaintenanceCommand).toHaveBeenCalledTimes(2)
    // Still only the single launch prompt — every step reused the
    // commandDocState's report rather than asking the user again.
    expect(mockShowDocumentationRequiredModal).toHaveBeenCalledTimes(1)
    expect(
      !result.current.commandDocState.isLoading &&
        result.current.commandDocState.reasonForInteractionRequired &&
        result.current.commandDocState.docreport
    ).toEqual(MOCK_DOCREPORT)

    // 3) Tearing the run down via the deletion mutation prompts the user
    //    a second time for documentation right before the end of the run.
    await act(async () => {
      result.current.deleteRun.deleteMaintenanceRun(MAINTENANCE_RUN_ID)
    })

    await waitFor(() => {
      expect(deleteMaintenanceRun).toHaveBeenCalledTimes(1)
    })
    expect(mockShowDocumentationRequiredModal).toHaveBeenCalledTimes(2)
  })
})
