import { useTranslation } from 'react-i18next'
import { useHardwareStatusText } from './useHardwareStatusText'
import type { ProtocolHardware } from '/app/transformations/commands'

export function useRerunnableStatusText(
  runOk: boolean,
  missingProtocolhardware: ProtocolHardware[],
  conflictedSlots: string[]
): string {
  const hardwareStatus = useHardwareStatusText(
    missingProtocolhardware,
    conflictedSlots
  )
  const { t, i18n } = useTranslation('device_details')
  return runOk ? hardwareStatus : i18n.format(t('bad_run'), 'capitalize')
}
