import { useRobotControlCommands } from '/app/resources/maintenance_runs'

import type { CreateCommand } from '@opentrons/shared-data'
import type {
  UseRobotControlCommandsProps,
  UseRobotControlCommandsResult,
} from '/app/resources/maintenance_runs'

export interface UseHomeGantryResult {
  isHoming: UseRobotControlCommandsResult['isExecuting']
  homeGantry: UseRobotControlCommandsResult['executeCommands']
}

export type UseHomeGantryProps = Pick<UseRobotControlCommandsProps, 'onSuccess'>

// Home all gantry axes via a maintenance run.
export function useHomeGantry(props: UseHomeGantryProps): UseHomeGantryResult {
  const { executeCommands, isExecuting } = useRobotControlCommands({
    ...props,
    pipetteInfo: null,
    commands: [HOME_GANTRY],
    continuePastCommandFailure: true,
    runStartedAction: 'home_gantry',
    runEndedAction: 'end_home_gantry',
  })

  return {
    isHoming: isExecuting,
    homeGantry: executeCommands,
  }
}

const HOME_GANTRY: CreateCommand = {
  commandType: 'home' as const,
  params: {},
}
