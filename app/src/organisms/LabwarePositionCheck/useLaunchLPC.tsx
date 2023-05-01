import * as React from 'react'
import {
  useCreateMaintenanceRunMutation,
  useDeleteMaintenanceRunMutation,
  useRunQuery,
} from '@opentrons/react-api-client'
import { LabwarePositionCheck } from '.'
import { useMostRecentCompletedAnalysis } from './useMostRecentCompletedAnalysis'

export function useLaunchLPC(
  runId: string
): { launchLPC: () => void; LPCWizard: JSX.Element | null } {
  const { data: runRecord } = useRunQuery(runId, { staleTime: Infinity })
  const { createMaintenanceRun } = useCreateMaintenanceRunMutation()
  const { deleteMaintenanceRun } = useDeleteMaintenanceRunMutation()
  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)
  const [maintenanceRunId, setMaintenanceRunId] = React.useState<string | null>(
    null
  )

  const handleCloseLPC = (): void => {
    if (maintenanceRunId != null) {
      deleteMaintenanceRun(maintenanceRunId, {
        onSuccess: () => {
          setMaintenanceRunId(null)
        },
      })
    }
  }
  return {
    launchLPC: () =>
      createMaintenanceRun(
        {},
        {
          onSuccess: maintenanceRun =>
            setMaintenanceRunId(maintenanceRun.data.id),
        }
      ),
    LPCWizard:
      maintenanceRunId != null ? (
        <LabwarePositionCheck
          onCloseClick={handleCloseLPC}
          runId={runId}
          mostRecentAnalysis={mostRecentAnalysis}
          existingOffsets={runRecord?.data?.labwareOffsets ?? []}
          maintenanceRunId={maintenanceRunId}
        />
      ) : null,
  }
}
