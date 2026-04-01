import { useTranslation } from 'react-i18next'

import type { WarningType } from '@opentrons/step-generation'
import type { AlertLevel } from './types'

interface WarningContentsProps {
  warningType: WarningType
  level: AlertLevel
}
export function WarningContents(
  props: WarningContentsProps
): JSX.Element | null {
  const { warningType, level } = props
  const { t } = useTranslation('alert')
  return t(`${level}.warning.${warningType}.body`, {
    defaultValue: '',
  })
}
