import { getModuleDisplayName } from '@opentrons/shared-data'

import { getModuleDisplayLocation } from '../getModuleDisplayLocation'

import type { IdentifyModuleRunTimeCommand } from '@opentrons/shared-data'
import type { HandlesCommands } from '../types'

export function getIdentifyModuleCommandText({
  command,
  commandTextData,
  t,
}: HandlesCommands<IdentifyModuleRunTimeCommand>): string {
  const { model, moduleId, start, color } = command.params
  const modelName = getModuleDisplayName(model)
  const slot = getModuleDisplayLocation(
    commandTextData?.modules ?? [],
    moduleId
  )
  const colorText = color ? t(color) : ''
  const startText = start ? t('starting') : t('stopping')
  return t('identify_module', {
    model: modelName,
    slot,
    start: startText,
    color: colorText,
  })
}
