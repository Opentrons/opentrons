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

export type UseHomePipettesProps = Pick<
  UseRobotControlCommandsProps,
  'pipetteInfo' | 'onSettled'
>
// TODO(jh, 09-12-24): Find a better place for this hook to live.
// Home pipettes except for plungers.
export function useHomePipettes(
  props: UseHomePipettesProps
): UseHomePipettesResult {
  const { executeCommands, isExecuting } = useRobotControlCommands({
    ...props,
    commands: [HOME_EXCEPT_PLUNGERS],
    continuePastCommandFailure: true,
  })

  return {
    isHoming: isExecuting,
    homePipettes: executeCommands,
  }
}

const HOME_EXCEPT_PLUNGERS: CreateCommand = {
  commandType: 'home' as const,
  params: { axes: ['leftZ', 'rightZ', 'x', 'y'] },
}
