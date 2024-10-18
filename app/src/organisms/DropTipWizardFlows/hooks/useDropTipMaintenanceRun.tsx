import { useState, useEffect } from 'react'

import {
  useChainMaintenanceCommands,
  useNotifyCurrentMaintenanceRun,
} from '/app/resources/maintenance_runs'
import { useCreateTargetedMaintenanceRunMutation } from '/app/resources/runs'
import { buildLoadPipetteCommand } from './useDropTipCommands'

import type { PipetteModelSpecs } from '@opentrons/shared-data'
import type { PipetteData } from '@opentrons/api-client'
import type { SetRobotErrorDetailsParams, UseDTWithTypeParams } from '.'

const RUN_REFETCH_INTERVAL_MS = 5000

export type UseDropTipMaintenanceRunParams = Omit<
  UseDTWithTypeParams,
  'instrumentModelSpecs' | 'mount'
> & {
  setErrorDetails: (errorDetails: SetRobotErrorDetailsParams) => void
  instrumentModelSpecs?: PipetteModelSpecs
  mount?: PipetteData['mount']
}

// Manages the maintenance run state if the flow is utilizing "setup" type commands.
export function useDropTipMaintenanceRun({
  issuedCommandsType,
  mount,
  instrumentModelSpecs,
  setErrorDetails,
  closeFlow,
}: UseDropTipMaintenanceRunParams): string | null {
  const isMaintenanceRunType = issuedCommandsType === 'setup'

  const [createdMaintenanceRunId, setCreatedMaintenanceRunId] = useState<
    string | null
  >(null)

  const { data: maintenanceRunData } = useNotifyCurrentMaintenanceRun({
    refetchInterval: RUN_REFETCH_INTERVAL_MS,
  })

  const activeMaintenanceRunId = maintenanceRunData?.data.id

  useCreateDropTipMaintenanceRun({
    issuedCommandsType,
    mount,
    instrumentModelName: instrumentModelSpecs?.name,
    setErrorDetails,
    setCreatedMaintenanceRunId,
  })

  useMonitorMaintenanceRunForDeletion({
    isMaintenanceRunType,
    activeMaintenanceRunId,
    createdMaintenanceRunId,
    closeFlow,
  })

  return activeMaintenanceRunId ?? null
}

type UseCreateDropTipMaintenanceRunParams = Omit<
  UseDropTipMaintenanceRunParams,
  'robotType' | 'closeFlow' | 'modalStyle'
> & {
  setCreatedMaintenanceRunId: (id: string) => void
  instrumentModelName?: PipetteModelSpecs['name']
}

// Handles the creation of the maintenance run for "setup" command type drop tip flows, including the loading of the pipette.
function useCreateDropTipMaintenanceRun({
  issuedCommandsType,
  mount,
  instrumentModelName,
  setErrorDetails,
  setCreatedMaintenanceRunId,
}: UseCreateDropTipMaintenanceRunParams): void {
  const { chainRunCommands } = useChainMaintenanceCommands()

  const {
    createTargetedMaintenanceRun,
  } = useCreateTargetedMaintenanceRunMutation({
    onSuccess: response => {
      // The type assertions here are safe, since we only use this command after asserting these
      const loadPipetteCommand = buildLoadPipetteCommand(
        instrumentModelName as string,
        mount as PipetteData['mount']
      )

      chainRunCommands(response.data.id, [loadPipetteCommand], false)
        .then(() => {
          setCreatedMaintenanceRunId(response.data.id)
        })
        .catch((error: Error) => error)
    },
    onError: (error: Error) => {
      setErrorDetails({ message: error.message })
    },
  })

  useEffect(() => {
    if (
      issuedCommandsType === 'setup' &&
      mount != null &&
      instrumentModelName != null
    ) {
      createTargetedMaintenanceRun({}).catch((e: Error) => {
        setErrorDetails({
          message: `Error creating maintenance run: ${e.message}`,
        })
      })
    } else {
      console.warn(
        'Could not create maintenance run due to missing pipette data.'
      )
    }
  }, [mount, instrumentModelName])
}

interface UseMonitorMaintenanceRunForDeletionParams {
  isMaintenanceRunType: boolean
  closeFlow: () => void
  createdMaintenanceRunId: string | null
  activeMaintenanceRunId?: string
}

// Monitor the maintenance run, as we need to keep the desktop and ODD in sync.
// Close the drop tip flows if the maintenance run was terminated on the ODD.
function useMonitorMaintenanceRunForDeletion({
  isMaintenanceRunType,
  createdMaintenanceRunId,
  activeMaintenanceRunId,
  closeFlow,
}: UseMonitorMaintenanceRunForDeletionParams): void {
  const [
    monitorMaintenanceRunForDeletion,
    setMonitorMaintenanceRunForDeletion,
  ] = useState<boolean>(false)
  const [closedOnce, setClosedOnce] = useState<boolean>(false)

  useEffect(() => {
    if (isMaintenanceRunType && !closedOnce) {
      if (
        createdMaintenanceRunId !== null &&
        activeMaintenanceRunId === createdMaintenanceRunId
      ) {
        setMonitorMaintenanceRunForDeletion(true)
      }
      if (
        activeMaintenanceRunId !== createdMaintenanceRunId &&
        monitorMaintenanceRunForDeletion
      ) {
        closeFlow()
        setClosedOnce(true)
      }
    }
  }, [isMaintenanceRunType, createdMaintenanceRunId, activeMaintenanceRunId])
}
