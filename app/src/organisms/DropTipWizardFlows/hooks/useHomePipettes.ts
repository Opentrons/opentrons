import * as React from 'react'

import {
  useCreateMaintenanceCommandMutation,
  useDeleteMaintenanceRunMutation,
} from '@opentrons/react-api-client'

import { useDropTipMaintenanceRun } from './useDropTipMaintenanceRun'

import type { UseDropTipMaintenanceRunParams } from './useDropTipMaintenanceRun'
import type { CreateCommand } from '@opentrons/shared-data'

export type UseHomePipettesProps = Omit<
  UseDropTipMaintenanceRunParams,
  'issuedCommandsType' | 'closeFlow'
> & {
  onComplete: () => void
}

export function useHomePipettes(
  props: UseHomePipettesProps
): {
  homePipettes: () => void
  isHomingPipettes: boolean
} {
  const [isHomingPipettes, setIsHomingPipettes] = React.useState(false)
  const { deleteMaintenanceRun } = useDeleteMaintenanceRunMutation()

  const createdMaintenanceRunId = useDropTipMaintenanceRun({
    ...props,
    issuedCommandsType: 'setup',
    enabled: isHomingPipettes,
    closeFlow: props.onComplete,
  })
  const isMaintenanceRunActive = createdMaintenanceRunId != null

  // Home the pipette after user click once a maintenance run has been created.
  React.useEffect(() => {
    if (isMaintenanceRunActive && isHomingPipettes) {
      void homePipettesCmd().finally(() => {
        props.onComplete()
        deleteMaintenanceRun(createdMaintenanceRunId)
      })
    }
  }, [isMaintenanceRunActive, isHomingPipettes])

  const { createMaintenanceCommand } = useCreateMaintenanceCommandMutation()

  const homePipettesCmd = React.useCallback(() => {
    if (createdMaintenanceRunId != null) {
      return createMaintenanceCommand(
        {
          maintenanceRunId: createdMaintenanceRunId,
          command: HOME_EXCEPT_PLUNGERS,
          waitUntilComplete: true,
        },
        { onSettled: () => Promise.resolve() }
      )
    } else {
      return Promise.reject(
        new Error(
          "'Unable to create a maintenance run when attempting to home pipettes."
        )
      )
    }
  }, [createMaintenanceCommand, createdMaintenanceRunId])

  return {
    homePipettes: () => {
      setIsHomingPipettes(true)
    },
    isHomingPipettes,
  }
}

const HOME_EXCEPT_PLUNGERS: CreateCommand = {
  commandType: 'home' as const,
  params: { axes: ['leftZ', 'rightZ', 'x', 'y'] },
}
