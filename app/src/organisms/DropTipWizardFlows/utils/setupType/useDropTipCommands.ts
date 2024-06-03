import * as React from 'react'

import {
  useCreateMaintenanceCommandMutation,
  useDeleteMaintenanceRunMutation,
} from '@opentrons/react-api-client'

import {
  useChainMaintenanceCommands,
  useCreateTargetedMaintenanceRunMutation,
} from '../../../resources/runs'
import { useNotifyCurrentMaintenanceRun } from '../../../resources/maintenance_runs'
import { MANAGED_PIPETTE_ID } from '../constants'
import { getAddressableAreaFromConfig } from '../../getAddressableAreaFromConfig'
import { useNotifyDeckConfigurationQuery } from '../../../../resources/deck_configuration'

import type { PipetteData } from '@opentrons/api-client'
import type {
  PipetteModelSpecs,
  CreateCommand,
  AddressableAreaName,
} from '@opentrons/shared-data'
import type { ErrorDetails } from './utils'
import type { DropTipWizardFlowsProps } from '../index'

interface UseDropTipSetupCommandsParams {
  activeMaintenanceRunId: string | null
  chainRunCommands: ReturnType<
    typeof useChainMaintenanceCommands
  >['chainRunCommands']
  closeFlow: () => void
}

export interface UseDropTipSetupCommands {
  handleCleanUpAndClose: (homeOnExit: boolean) => void
}

function useDropTipSetupCommands({
  activeMaintenanceRunId,
  chainRunCommands,
  closeFlow,
}: UseDropTipSetupCommandsParams) {
  // TOME: Perhaps move the isExiting logic eventually.
  const [isExiting, setIsExiting] = React.useState<boolean>(false)

  const hasCleanedUpAndClosed = React.useRef(false)

  const { deleteMaintenanceRun } = useDeleteMaintenanceRunMutation({
    onSuccess: () => closeFlow(),
    onError: () => closeFlow(),
  })
  const deckConfig = useNotifyDeckConfigurationQuery().data ?? []

  const handleCleanUpAndClose = (homeOnExit: boolean = true): void => {
    if (!hasCleanedUpAndClosed.current) {
      hasCleanedUpAndClosed.current = true
      setIsExiting(true)
      if (activeMaintenanceRunId == null) {
        closeFlow()
      } else {
        ;(homeOnExit
          ? chainRunCommands(
              activeMaintenanceRunId,
              [HOME_EXCEPT_PLUNGERS],
              true
            )
          : new Promise<void>((resolve, reject) => resolve())
        )
          .catch((error: Error) => {
            console.error(error.message)
          })
          .finally(() => deleteMaintenanceRun(activeMaintenanceRunId))
      }
    }
  }

  const moveToAddressableArea = (
    addressableArea: AddressableAreaName
  ): Promise<null> => {
    const addressableAreaFromConfig = getAddressableAreaFromConfig(
      addressableArea,
      deckConfig,
      instrumentModelSpecs.channels,
      robotType
    )

    if (addressableAreaFromConfig != null) {
      return chainRunCommands(
        createdMaintenanceRunId,
        [
          {
            commandType: 'moveToAddressableArea',
            params: {
              pipetteId: MANAGED_PIPETTE_ID,
              stayAtHighestPossibleZ: true,
              addressableAreaName: addressableAreaFromConfig,
              offset: { x: 0, y: 0, z: 0 },
            },
          },
        ],
        true
      ).then(commandData => {
        const error = commandData[0].data.error
        if (error != null) {
          setSpecificErrorDetails({
            runCommandError: error,
            message: `Error moving to position: ${error.detail}`,
          })
        }
        return null
      })
    } else {
      setSpecificErrorDetails({
        message: `Error moving to position: invalid addressable area.`,
      })
      return Promise.resolve(null)
    }
  }
}

// Commands
const HOME_EXCEPT_PLUNGERS: CreateCommand = {
  commandType: 'home' as const,
  params: { axes: ['leftZ', 'rightZ', 'x', 'y'] },
}
