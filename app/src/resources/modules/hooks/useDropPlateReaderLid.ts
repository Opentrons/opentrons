import { useRobotControlCommands } from '/app/resources/maintenance_runs'

import type { CreateCommand } from '@opentrons/shared-data'
import type {
  UseRobotControlCommandsProps,
  UseRobotControlCommandsResult,
} from '/app/resources/maintenance_runs'

interface UseHomePipettesResult {
  isHoming: UseRobotControlCommandsResult['isExecuting']
  homePipettes: UseRobotControlCommandsResult['executeCommands']
}

export type UseDropPlateReaderLidProps = Pick<
  UseRobotControlCommandsProps,
  'pipetteInfo' | 'onSettled'
>

export function useDropPlateReaderLid(
  props: UseDropPlateReaderLidProps
): UseHomePipettesResult {
  const { executeCommands, isExecuting } = useRobotControlCommands({
    ...props,
    commands: [LOAD_PLATE_READER, DROP_PLATE_READER_LID],
    continuePastCommandFailure: true,
  })

  return {
    isHoming: isExecuting,
    homePipettes: executeCommands,
  }
}

const LOAD_PLATE_READER: CreateCommand = {
  commandType: 'loadModule' as const,
  params: {"model": "absorbanceReaderV1", "location": {"slotName": "C3"}},
}

const DROP_PLATE_READER_LID: CreateCommand = {
  commandType: 'moveLabware' as const,
  params: 
      {
      "labwareId": "absorbanceReaderV1LidC3",
      "newLocation": {"slotName": "C3"},
      "strategy": "usingGripper",
  },
}
