import clsx from 'clsx'

import { getLabwareDefinitionsFromCommands } from '@opentrons/components'

import { useNotifyCurrentMaintenanceRun } from '/app/resources/maintenance_runs'
import {
  useCurrentRunId,
  useMostRecentCompletedAnalysis,
  useNotifyRunQuery,
  useRunLoadedLabwareDefinitionsByUri,
} from '/app/resources/runs'

import { ActionItem } from './ActionItem'
import styles from './actionlist.module.css'

import type { ReactNode } from 'react'
import type { CommandTextData } from '@opentrons/components'
import type { DocumentedAction } from '@opentrons/react-api-client'
import type { RunTimeCommand } from '@opentrons/shared-data'

export const ActionList = ({
  actionsToDocument,
  className,
}: {
  actionsToDocument: DocumentedAction[]
  className?: string
}): ReactNode => {
  const allRunTimeCommands = actionsToDocument.filter(isRunTimeCommand)
  const { data: maintenanceRun } = useNotifyCurrentMaintenanceRun()
  const currentRunId = useCurrentRunId()
  const { data: protocolRun } = useNotifyRunQuery(currentRunId)
  const protocolAnalysis = useMostRecentCompletedAnalysis(currentRunId)
  // Only needed for protocol-run fixit commands; skip while a maintenance run is active.
  const runLwDefsByUri = useRunLoadedLabwareDefinitionsByUri(
    maintenanceRun?.data != null ? null : currentRunId
  )

  const allRunDefs =
    runLwDefsByUri != null
      ? Object.values(runLwDefsByUri)
      : getLabwareDefinitionsFromCommands(
          protocolAnalysis?.commands ?? allRunTimeCommands
        )

  const commandTextData = getCommandTextData(
    maintenanceRun,
    protocolRun,
    protocolAnalysis?.commands,
    allRunTimeCommands
  )
  return (
    <div className={clsx(styles.actions_list, className)}>
      {actionsToDocument.map((action, i) => (
        <ActionItem
          key={`action-${i}`}
          action={action}
          allRunDefs={allRunDefs}
          commandTextData={commandTextData}
          className={styles.action}
        />
      ))}
    </div>
  )
}

function isRunTimeCommand(action: DocumentedAction): action is RunTimeCommand {
  return typeof action === 'object' && 'commandType' in action
}

function getCommandTextData(
  maintenanceRun: ReturnType<typeof useNotifyCurrentMaintenanceRun>['data'],
  protocolRun: ReturnType<typeof useNotifyRunQuery>['data'],
  analysisCommands: RunTimeCommand[] | undefined,
  documentedCommands: RunTimeCommand[]
): CommandTextData | null {
  if (maintenanceRun?.data != null) {
    return {
      pipettes: maintenanceRun.data.pipettes ?? [],
      labware: maintenanceRun.data.labware ?? [],
      modules: maintenanceRun.data.modules ?? [],
      liquids: maintenanceRun.data.liquids ?? [],
      commands: documentedCommands,
    }
  }

  if (protocolRun?.data != null) {
    return {
      pipettes: protocolRun.data.pipettes ?? [],
      labware: protocolRun.data.labware ?? [],
      modules: protocolRun.data.modules ?? [],
      liquids: protocolRun.data.liquids ?? [],
      // Analysis commands include loadLabware results needed for location/name
      // lookup; append documented fixit commands so they can be found by id.
      commands:
        analysisCommands != null
          ? [...analysisCommands, ...documentedCommands]
          : documentedCommands,
    }
  }

  return {
    pipettes: [],
    labware: [],
    modules: [],
    liquids: [],
    commands: documentedCommands,
  }
}
