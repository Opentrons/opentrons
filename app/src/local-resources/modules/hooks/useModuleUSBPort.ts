import { useTranslation  } from 'react-i18next'
import { FLEX_STACKER_MODULE_TYPE } from '@opentrons/shared-data'

import type { AttachedModule } from '/app/redux/modules/types'

export function useModuleUSBPort(module: AttachedModule): string {
  const { t } = useTranslation('device_details')
  const { port, hubPort } = module.usbPort
  if (module.moduleType === FLEX_STACKER_MODULE_TYPE) {
    return t('usb_port_stacker', { port: hubPort })
  }
  return t('usb_port', { port: port + (hubPort !== undefined ? '.' + hubPort : '') })
}
