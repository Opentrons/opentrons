import { useRobotControlCommands } from '/app/resources/maintenance_runs'

import { LabwareLocation, type CreateCommand } from '@opentrons/shared-data'
import type {
  UseRobotControlCommandsProps,
  UseRobotControlCommandsResult,
} from '/app/resources/maintenance_runs'

interface UsePlacePlateReaderLidResult {
  isPlacing: UseRobotControlCommandsResult['isExecuting']
  placeReaderLid: UseRobotControlCommandsResult['executeCommands']
}

export type UsePlacePlateReaderLidProps = Pick<
  UseRobotControlCommandsProps,
  'pipetteInfo' | 'onSettled'
>

// TODO: Need to conditionally run this function based on `runs/currentState` value
export function usePlacePlateReaderLid(
  props: UsePlacePlateReaderLidProps
): UsePlacePlateReaderLidResult {
  const labwareId: string = 'absorbanceReaderV1LidC3'
  const location: LabwareLocation = {slotName: 'C3'}

  const LOAD_PLATE_READER: CreateCommand = {
    commandType: 'loadModule' as const,
    params: { model: 'absorbanceReaderV1', location: location },
  }

  const PLACE_READER_LID: CreateCommand = {
    commandType: 'unsafe/placeLabware' as const,
    params: {
      labwareId: labwareId,
      location: location,
    },
  }

  const { executeCommands, isExecuting } = useRobotControlCommands({
    ...props,
    commands: [LOAD_PLATE_READER, PLACE_READER_LID],
    continuePastCommandFailure: true,
  })

  return {
    isPlacing: isExecuting,
    placeReaderLid: executeCommands,
  }
}
