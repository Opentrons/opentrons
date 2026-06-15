import { useRunCurrentState } from '@opentrons/react-api-client'

import { useRobotControlCommands } from '/app/resources/maintenance_runs'

import { useCurrentRunId } from '../../runs'

import type {
  CreateCommand,
  ModuleLocation,
  OnDeckLabwareLocation,
} from '@opentrons/shared-data'
import type { UseRobotControlCommandsProps } from '/app/resources/maintenance_runs'

interface UsePlacePlateReaderLidResult {
  handlePlaceReaderLid: () => Promise<void>
  isExecuting: boolean
  isValidPlateReaderMove: boolean
}

type UsePlacePlateReaderLidProps = Pick<
  UseRobotControlCommandsProps,
  'onSuccess'
>

export function usePlacePlateReaderLid(
  props: UsePlacePlateReaderLidProps
): UsePlacePlateReaderLidResult {
  const runId = useCurrentRunId()
  const { data: runCurrentState } = useRunCurrentState(runId)

  const placeLabware = runCurrentState?.data.placeLabwareState ?? null
  const isValidPlateReaderMove =
    placeLabware !== null && placeLabware.shouldPlaceDown

  // TODO eventually load module support for useRobotControlCommands
  let commandsToExecute: CreateCommand[] = []
  if (isValidPlateReaderMove) {
    const location = placeLabware.location
    const loadModuleCommand = buildLoadModuleCommand(location as ModuleLocation)
    const placeLabwareCommand = buildPlaceLabwareCommand(
      placeLabware.labwareURI as string,
      location
    )
    commandsToExecute = [loadModuleCommand, placeLabwareCommand]
  }

  const { executeCommands, isExecuting } = useRobotControlCommands({
    ...props,
    pipetteInfo: null,
    commands: commandsToExecute,
    continuePastCommandFailure: true,
    runStartedAction: 'place_plate_reader_lid',
    runEndedAction: 'end_plate_reader_lid',
  })

  const handlePlaceReaderLid = (): Promise<void> => {
    if (isValidPlateReaderMove) {
      return executeCommands().then(() => Promise.resolve())
    } else {
      return Promise.resolve()
    }
  }

  return {
    handlePlaceReaderLid,
    isExecuting,
    isValidPlateReaderMove,
  }
}

const buildLoadModuleCommand = (location: ModuleLocation): CreateCommand => {
  return {
    commandType: 'loadModule' as const,
    params: { model: 'absorbanceReaderV1', location },
  }
}

const buildPlaceLabwareCommand = (
  labwareURI: string,
  location: OnDeckLabwareLocation
): CreateCommand => {
  return {
    commandType: 'unsafe/placeLabware' as const,
    params: { labwareURI, location },
  }
}
