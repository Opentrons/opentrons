import { uuid } from '../../utils'
import type { CommandCreator, Nozzles } from '../../types'

interface configureNozzleLayoutArgs {
  nozzles: Nozzles
}

//  @ts-expect-error: wait until we add this command to the ts command types!
export const configureNozzleLayout: CommandCreator<configureNozzleLayoutArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { nozzles } = args

  const commands = [
    {
      commandType: 'configureNozzleLayout' as const,
      key: uuid(),
      params: {
        nozzles,
      },
    },
  ]
  return {
    commands,
  }
}
