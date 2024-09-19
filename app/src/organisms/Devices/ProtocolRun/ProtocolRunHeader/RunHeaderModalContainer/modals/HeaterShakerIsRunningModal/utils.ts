import type { HeaterShakerModule } from '/app/redux/modules/types'
import type { AttachedModule } from '@opentrons/api-client'

export function getActiveHeaterShaker(
  attachedModules: any[]
): HeaterShakerModule | undefined {
  return attachedModules.find(
    (module): module is HeaterShakerModule =>
      module.moduleType === 'heaterShakerModuleType' &&
      module?.data != null &&
      module.data.speedStatus !== 'idle'
  )
}

export function isAnyHeaterShakerShaking(
  attachedModules: AttachedModule[]
): boolean {
  return attachedModules
    .filter(
      (module): module is HeaterShakerModule =>
        module.moduleType === 'heaterShakerModuleType'
    )
    .some(module => module?.data != null && module.data.speedStatus !== 'idle')
}
