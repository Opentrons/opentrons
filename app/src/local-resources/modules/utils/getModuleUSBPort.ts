import { FLEX_STACKER_MODULE_TYPE } from '@opentrons/shared-data'
import type { AttachedModule } from '/app/redux/modules/types'

export function getModuleUSBPort(
  module: AttachedModule
): string | undefined {
  const { port , hubPort } = module.usbPort
    if (module.moduleType === FLEX_STACKER_MODULE_TYPE) {
      return hubPort !== undefined ? `S-${hubPort}` : undefined
    }
  return `USB-${port}${hubPort !== undefined ? '.' + hubPort : ''}`
} 
