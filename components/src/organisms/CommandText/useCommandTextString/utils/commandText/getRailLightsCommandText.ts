import type { HandlesCommands } from '../types'
import type { RunTimeCommand } from '@opentrons/shared-data/command'

type HandledCommands = Extract<RunTimeCommand, { commandType: 'setRailLights' }>

export type GetRailLightsCommandText = HandlesCommands<HandledCommands>

export function getRailLightsCommandText({
  command,
  t,
}: GetRailLightsCommandText): string {
  return command.params.on
    ? t('turning_rail_lights_on')
    : t('turning_rail_lights_off')
}
