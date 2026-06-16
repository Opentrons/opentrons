import clsx from 'clsx'

import { getLabwareDefinitionsFromCommands } from '@opentrons/components'

import { useNotifyCurrentMaintenanceRun } from '/app/resources/maintenance_runs'

import { ActionItem } from './ActionItem'
import styles from './actionList.module.css'

import type { DocumentedAction } from '@opentrons/react-api-client'
import type { RunTimeCommand } from '@opentrons/shared-data'

export const ActionList = ({
  actionsToDocument,
  className,
}: {
  actionsToDocument: DocumentedAction[]
  className?: string
}): JSX.Element => {
  const allRunTimeCommands = actionsToDocument.filter(isRunTimeCommand)
  const allRunDefs = getLabwareDefinitionsFromCommands(allRunTimeCommands)
  const { data } = useNotifyCurrentMaintenanceRun()
  const commandTextData =
    data != null
      ? {
          pipettes: data?.data.pipettes ?? [],
          labware: data?.data.labware ?? [],
          modules: data?.data.modules ?? [],
          liquids: data?.data.liquids ?? [],
          commands: allRunTimeCommands,
        }
      : null
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
