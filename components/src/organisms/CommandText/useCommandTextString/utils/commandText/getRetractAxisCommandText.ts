import type { RetractAxisRunTimeCommand } from '@opentrons/shared-data/command'
import type { HandlesCommands } from '../types'

export function getRetractAxisCommandText({
  command,
  t,
}: HandlesCommands<RetractAxisRunTimeCommand>): string {
  const { axis } = command.params
  return t('retract_axis', { axis })
}
