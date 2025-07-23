import { FLEX_STACKER_MODULE_TYPE } from '@opentrons/shared-data'
import type { AttachedModule } from '/app/redux/modules/types'

export * from './getModuleImage'
export * from './getModulePrepCommands'


export function getModuleUSBPort(
  module: AttachedModule
): string {
  if (module.usbPort === null) {
    return ''
  }
  const { port , hubPort } = module.usbPort
    if (module.moduleType === FLEX_STACKER_MODULE_TYPE) {
      return hubPort !== undefined ? `S-${hubPort}` : ''
    }
  return `USB-${port}${hubPort !== undefined ? '.' + hubPort : ''}`
}

