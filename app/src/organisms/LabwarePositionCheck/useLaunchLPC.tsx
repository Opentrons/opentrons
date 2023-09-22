import * as React from 'react'
import {
  useCreateMaintenanceRunLabwareDefinitionMutation,
  useDeleteMaintenanceRunMutation,
  useRunQuery,
} from '@opentrons/react-api-client'
import { useCreateTargetedMaintenanceRunMutation } from '../../resources/runs/hooks'
import { LabwarePositionCheck } from '.'
import { useMostRecentCompletedAnalysis } from './useMostRecentCompletedAnalysis'
import { getLabwareDefinitionsFromCommands } from './utils/labware'

export function useLaunchLPC(
  runId: string
): { launchLPC: () => void; LPCWizard: JSX.Element | null } {
  const { data: runRecord } = useRunQuery(runId, { staleTime: Infinity })
  const {
    createTargetedMaintenanceRun,
  } = useCreateTargetedMaintenanceRunMutation()
  const { deleteMaintenanceRun } = useDeleteMaintenanceRunMutation()
  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)
  const [maintenanceRunId, setMaintenanceRunId] = React.useState<string | null>(
    null
  )
  const currentOffsets = runRecord?.data?.labwareOffsets ?? []
  const {
    createLabwareDefinition,
  } = useCreateMaintenanceRunLabwareDefinitionMutation()

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
      createTargetedMaintenanceRun({
        labwareOffsets: currentOffsets.map(
          ({ vector, location, definitionUri }) => ({
            vector,
            location,
            definitionUri,
          })
        ),
      }).then(maintenanceRun =>
        // TODO(BC, 2023-05-15): replace this with a call to the protocol run's GET labware_definitions
        // endpoint once it's made we should be adding the definitions to the maintenance run by
        // reading from the current protocol run, and not from the analysis
        Promise.all(
          getLabwareDefinitionsFromCommands(
            mostRecentAnalysis?.commands ?? []
          ).map(def =>
            createLabwareDefinition({
              maintenanceRunId: maintenanceRun?.data?.id,
              labwareDef: def,
            })
          )
        ).then(() => {
          setMaintenanceRunId(maintenanceRun.data.id)
        })
      ),
    LPCWizard:
      maintenanceRunId != null ? (
        <LabwarePositionCheck
          onCloseClick={handleCloseLPC}
          runId={runId}
          mostRecentAnalysis={mostRecentAnalysis}
          existingOffsets={runRecord?.data?.labwareOffsets ?? []}
          maintenanceRunId={maintenanceRunId}
          setMaintenanceRunId={setMaintenanceRunId}
        />
      ) : null,
  }
}
