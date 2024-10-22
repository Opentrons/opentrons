import { useState } from 'react'

import { LabwareLocation, type CreateCommand, ModuleLocation } from '@opentrons/shared-data'
import {
  useChainMaintenanceCommands,
} from '/app/resources/maintenance_runs'
import { useDeleteMaintenanceRunMutation, useRunCurrentState } from '@opentrons/react-api-client'
import { useCreateTargetedMaintenanceRunMutation, useCurrentRunId } from '../../runs'
import { MaintenanceRun } from '@opentrons/api-client'

interface UsePlacePlateReaderLidResult {
  placeReaderLid: () => Promise<MaintenanceRun>
  isPlacing: boolean
}

export interface UsePlacePlateReaderLidProps {

}

export function usePlacePlateReaderLid(
  props: UsePlacePlateReaderLidProps
): UsePlacePlateReaderLidResult {
  const [isPlacing, setIsPlacing] = useState(false)
  const { chainRunCommands } = useChainMaintenanceCommands()
  const {
    mutateAsync: deleteMaintenanceRun,
  } = useDeleteMaintenanceRunMutation()

  const runId = useCurrentRunId()
  const { data: runCurrentState } = useRunCurrentState(runId)
  const placeLabware = runCurrentState?.data.placeLabwareState ?? null

  const {
    createTargetedMaintenanceRun,
  } = useCreateTargetedMaintenanceRunMutation({
    onSuccess: response => {
      const runId = response.data.id as string

      const loadModuleIfSupplied = (): Promise<void> => {
        if (placeLabware !== null && placeLabware.shouldPlaceDown) {
          const location = placeLabware.location
          const labwareId = placeLabware.labwareId
          const moduleLocation: ModuleLocation = location as ModuleLocation
          const loadModuleCommand = buildLoadModuleCommand(moduleLocation)
          const placeLabwareCommand = buildPlaceLabwareCommand(labwareId, location)
          console.log({location, labwareId})
          console.log({loadModuleCommand, placeLabwareCommand})
          return chainRunCommands(runId, [loadModuleCommand, placeLabwareCommand], false)
            .then(() => Promise.resolve())
            .catch((error: Error) => {
              console.error(error.message)
            })
        }
        return Promise.resolve()
      }

      loadModuleIfSupplied()
        .catch((error: Error) => {
          console.error(error.message)
        })
        .finally(() =>
          deleteMaintenanceRun(runId).catch((error: Error) => {
            console.error('Failed to delete maintenance run:', error.message)
        }))
        setIsPlacing(false)
    }
  })

  const placeReaderLid = (): Promise<MaintenanceRun> => {
    setIsPlacing(true)
    return createTargetedMaintenanceRun({})
  }

  return { placeReaderLid, isPlacing }
}

const buildLoadModuleCommand = (
  location: ModuleLocation
): CreateCommand => {
  return {
    commandType: 'loadModule' as const,
    params: { model: 'absorbanceReaderV1', location: location },
  }
}

const buildPlaceLabwareCommand = (
  labwaerId: string,
  location: LabwareLocation
): CreateCommand => {
  return {
    commandType: 'unsafe/placeLabware' as const,
    params: { labwareId, location },
  }
}
