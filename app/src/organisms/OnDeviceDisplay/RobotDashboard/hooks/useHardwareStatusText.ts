import { useTranslation } from 'react-i18next'

import { useFeatureFlag } from '../../../../redux/config'

import type { ProtocolHardware } from '../../../../pages/Protocols/hooks'

export function useHardwareStatusText(
  missingProtocolHardware: ProtocolHardware[],
  conflictedSlots: string[]
): string {
  const { t, i18n } = useTranslation('device_details')
  const enableDeckConfig = useFeatureFlag('enableDeckConfiguration')

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
  if (enableDeckConfig && conflictedSlots.length > 0) {
    chipText = t('location_conflicts')
  } else if (countMissingPipettes === 0 && countMissingModules > 0) {
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
