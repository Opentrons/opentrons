import { useTranslation } from 'react-i18next'

import type { ProtocolHardware } from '../../../../pages/Protocols/hooks'

export function useHardwareStatusText(
  missingProtocolHardware: ProtocolHardware[],
  conflictedSlots: string[]
): string {
  const { t, i18n } = useTranslation('device_details')
  const missingProtocolHardwareType = missingProtocolHardware.map(hardware =>
    hardware.hardwareType === 'pipette' || hardware.hardwareType === 'gripper'
      ? 'instrument'
      : hardware.hardwareType
  )
  const countMissingHardwareType = (
    hwType: 'instrument' | 'module' | 'fixture'
  ): number => {
    return missingProtocolHardwareType.filter(
      hardwareType => hardwareType === hwType
    ).length
  }

  const countMissingInstruments = countMissingHardwareType('instrument')
  const countMissingModules = countMissingHardwareType('module')
  const countMissingFixtures = countMissingHardwareType('fixture')

  const noHardwareMissing =
    [countMissingInstruments, countMissingModules, countMissingFixtures].filter(
      count => count > 0
    ).length === 0
  const multipleHardwareTypesMissing =
    [countMissingInstruments, countMissingModules, countMissingFixtures].filter(
      count => count > 0
    ).length > 1

  let chipText: string

  if (noHardwareMissing) {
    chipText = t('ready_to_run')
  } else if (conflictedSlots.length > 0) {
    chipText = t('location_conflicts')
  } else if (multipleHardwareTypesMissing) {
    chipText = t('missing_hardware')
  } else {
    // exactly one hardware type missing
    if (countMissingFixtures > 0) {
      chipText =
        countMissingFixtures === 1
          ? t('missing_fixture', { num: countMissingFixtures })
          : t('missing_fixtures_plural', { count: countMissingFixtures })
    } else if (countMissingModules > 0) {
      chipText =
        countMissingModules === 1
          ? t('missing_module', {
              num: countMissingModules,
            })
          : t('missing_module_plural', {
              count: countMissingModules,
            })
    } else {
      chipText =
        countMissingInstruments === 1
          ? t('missing_instrument', {
              num: countMissingInstruments,
            })
          : t('missing_instruments_plural', {
              count: countMissingInstruments,
            })
    }
  }
  return i18n.format(chipText, 'capitalize')
}
