import { useTranslation } from 'react-i18next'
import type { ProtocolHardware } from '../../../../pages/Protocols/hooks'

export function useMissingHardwareText(
  missingProtocolHardware: ProtocolHardware[]
): string {
  const { t, i18n } = useTranslation('device_details')
  const missingProtocolHardwareType = missingProtocolHardware.map(
    hardware => hardware.hardwareType
  )
  const countMissingHardwareType = (hwType: 'pipette' | 'module'): number => {
    return missingProtocolHardwareType.filter(
      hardwareType => hardwareType === hwType
    ).length
  }
  const countMissingPipettes = countMissingHardwareType('pipette')
  const countMissingModules = countMissingHardwareType('module')
  let chipText: string = t('ready_to_run')
  if (countMissingPipettes === 0 && countMissingModules > 0) {
    if (countMissingModules === 1) {
      chipText = t('missing_module', {
        num: countMissingModules,
      })
    } else {
      chipText = t('missing_module_plural', {
        count: countMissingModules,
      })
    }
  } else if (countMissingPipettes > 0 && countMissingModules === 0) {
    if (countMissingPipettes === 1) {
      chipText = t('missing_pipette', {
        num: countMissingPipettes,
      })
    } else {
      chipText = t('missing_pipettes_plural', {
        count: countMissingPipettes,
      })
    }
  } else if (countMissingPipettes > 0 && countMissingModules > 0) {
    chipText = t('missing_both')
  }
  return i18n.format(chipText, 'capitalize')
}
