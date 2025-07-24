import { FLEX_STACKER_MODULE_TYPE } from '@opentrons/shared-data'

import type { AttachedModule } from '/app/redux/modules/types'

export function getModuleUSBPort(module: AttachedModule): string {
  const { port, hubPort } = module.usbPort
  if (module.moduleType === FLEX_STACKER_MODULE_TYPE) {
    return `S-${hubPort}`
  }
  return `USB-${port}${hubPort !== undefined ? '.' + hubPort : ''}`
}
