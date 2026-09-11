import { useTranslation } from 'react-i18next'

import { FLEX_STACKER_MODULE_TYPE } from '@opentrons/shared-data'

import type { AttachedModule } from '@opentrons/api-client'

export interface UseModuleUSBPortResult {
  parseModuleUSBPort: (module: AttachedModule | null) => string
}

export function useModuleUSBPort(): UseModuleUSBPortResult {
  const { t } = useTranslation('device_details')

  const parseModuleUSBPort = (module: AttachedModule | null): string => {
    if (module?.usbPort == null) {
      return t('usb_port_not_connected')
    }

    const { port, hubPort } = module.usbPort
    if (module.moduleType === FLEX_STACKER_MODULE_TYPE) {
      if (hubPort != null) {
        return t('usb_port_stacker', { port: hubPort })
      } else {
        console.error(`Flex Stacker ${module.serialNumber} has no USB hubPort`)
        return t('usb_port_stacker', { port: t('unknown') })
      }
    }

    return t('usb_port', {
      port: port + (hubPort != null ? '.' + hubPort : ''),
    })
  }

  return { parseModuleUSBPort }
}
