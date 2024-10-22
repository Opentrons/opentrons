import { useRobotControlCommands } from '/app/resources/maintenance_runs'

import { LabwareLocation, type CreateCommand } from '@opentrons/shared-data'
import type {
  UseRobotControlCommandsProps,
  UseRobotControlCommandsResult,
} from '/app/resources/maintenance_runs'
import { useRunCurrentState } from '@opentrons/react-api-client'
import { useCurrentRunId } from '../../runs'

interface UsePlacePlateReaderLidResult {
  isPlacing: UseRobotControlCommandsResult['isExecuting']
  placeReaderLid: UseRobotControlCommandsResult['executeCommands']
}

export type UsePlacePlateReaderLidProps = Pick<
  UseRobotControlCommandsProps,
  'pipetteInfo' | 'onSettled'
>

export function usePlacePlateReaderLid(
  props: UsePlacePlateReaderLidProps
): UsePlacePlateReaderLidResult {
  const runId = useCurrentRunId()
  const { data: runCurrentState } = useRunCurrentState(runId)
  const estopEngaged = runCurrentState?.data.estopEngaged
  const placeLabware = runCurrentState?.data.placeLabwareState?.shouldPlaceDown
  const labwareId = runCurrentState?.data.placeLabwareState?.labwareId
  const location = runCurrentState?.data.placeLabwareState?.location

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

  const decideFunction = (): void => {
    console.log("DECIDE!")
    if (estopEngaged != null && placeLabware) {
        console.log("PLACE")
        executeCommands()
    } else {
        console.log("DONT PLACE")
    }
  }

  return {
    isPlacing: isExecuting,
    placeReaderLid: decideFunction,
  }
}
