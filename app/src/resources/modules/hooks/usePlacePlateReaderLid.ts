import {
  CreateCommand,
  OnDeckLabwareLocation,
  ModuleLocation,
} from '@opentrons/shared-data'
import { UseRobotControlCommandsProps } from '/app/resources/maintenance_runs'
import { useRunCurrentState } from '@opentrons/react-api-client'
import { useCurrentRunId } from '../../runs'
import { useRobotControlCommands } from '/app/resources/maintenance_runs'

interface UsePlacePlateReaderLidResult {
  handlePlaceReaderLid: () => Promise<void>
  isExecuting: boolean
  isValidPlateReaderMove: boolean
}

type UsePlacePlateReaderLidProps = Pick<
  UseRobotControlCommandsProps,
  'onSettled'
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
      placeLabware.labwareId as string,
      location
    )
    commandsToExecute = [loadModuleCommand, placeLabwareCommand]
  }

  const { executeCommands, isExecuting } = useRobotControlCommands({
    ...props,
    pipetteInfo: null,
    commands: commandsToExecute,
    continuePastCommandFailure: true,
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
    isExecuting: isExecuting,
    isValidPlateReaderMove,
  }
}

const buildLoadModuleCommand = (location: ModuleLocation): CreateCommand => {
  return {
    commandType: 'loadModule' as const,
    params: { model: 'absorbanceReaderV1', location: location },
  }
}

const buildPlaceLabwareCommand = (
  labwareId: string,
  location: OnDeckLabwareLocation
): CreateCommand => {
  return {
    commandType: 'unsafe/placeLabware' as const,
    params: { labwareId, location },
  }
}
