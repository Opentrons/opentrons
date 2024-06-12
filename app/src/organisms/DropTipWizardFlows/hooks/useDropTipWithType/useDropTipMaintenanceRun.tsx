import * as React from 'react'

import { useNotifyCurrentMaintenanceRun } from '../../../../resources/maintenance_runs'
import {
  useCreateTargetedMaintenanceRunMutation,
  useChainMaintenanceCommands,
} from '../../../../resources/runs'
import { buildLoadPipetteCommand } from './useDropTipCommands'

import type { PipetteModelSpecs } from '@opentrons/shared-data'
import type { PipetteData } from '@opentrons/api-client'
import type { SetRobotErrorDetailsParams } from '../errors'
import type { UseDTWithTypeParams } from '..'

const RUN_REFETCH_INTERVAL_MS = 5000

type UseDropTipMaintenanceRunParams = UseDTWithTypeParams & {
  setErrorDetails: (errorDetails: SetRobotErrorDetailsParams) => void
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

  const [createdMaintenanceRunId, setCreatedMaintenanceRunId] = React.useState<
    string | null
  >(null)

  const { data: maintenanceRunData } = useNotifyCurrentMaintenanceRun({
    refetchInterval: RUN_REFETCH_INTERVAL_MS,
    enabled: createdMaintenanceRunId != null && isMaintenanceRunType,
  })

  const activeMaintenanceRunId = maintenanceRunData?.data.id

  useCreateDropTipMaintenanceRun({
    issuedCommandsType,
    mount,
    instrumentModelName: instrumentModelSpecs.name,
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

interface UseCreateDropTipMaintenanceRunParams {
  issuedCommandsType: UseDTWithTypeParams['issuedCommandsType']
  mount: PipetteData['mount']
  instrumentModelName: PipetteModelSpecs['name']
  setErrorDetails: (errorDetails: SetRobotErrorDetailsParams) => void
  setCreatedMaintenanceRunId: (id: string) => void
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
      const loadPipetteCommand = buildLoadPipetteCommand(
        mount,
        instrumentModelName
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

  React.useEffect(() => {
    if (issuedCommandsType === 'setup') {
      createTargetedMaintenanceRun({}).catch((e: Error) => {
        setErrorDetails({
          message: `Error creating maintenance run: ${e.message}`,
        })
      })
    }
  }, [])
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
  ] = React.useState<boolean>(false)

  React.useEffect(() => {
    if (isMaintenanceRunType) {
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
      }
    }
  }, [
    isMaintenanceRunType,
    createdMaintenanceRunId,
    activeMaintenanceRunId,
    closeFlow,
  ])
}
