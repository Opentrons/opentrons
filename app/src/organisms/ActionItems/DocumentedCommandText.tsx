import { useCommandTextString } from '@opentrons/components'

import type { ReactNode } from 'react'
import type { CommandTextData } from '@opentrons/components'
import type { LabwareDefinition, RunTimeCommand } from '@opentrons/shared-data'

export function DocumentedCommandText({
  action,
  allRunDefs,
  commandTextData,
  className,
}: {
  action: RunTimeCommand
  allRunDefs: LabwareDefinition[]
  commandTextData: CommandTextData
  className?: string
}): ReactNode {
  const commandInfo = useCommandTextString({
    command: action,
    allRunDefs,
    robotType: 'OT-3 Standard',
    commandTextData,
  })

  return <div className={className}>{commandInfo.commandText}</div>
}
