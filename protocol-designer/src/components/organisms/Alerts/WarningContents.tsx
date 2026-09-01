import { useTranslation } from 'react-i18next'

import type { ReactNode } from 'react'
import type { WarningType } from '@opentrons/step-generation'
import type { AlertLevel } from './types'

interface WarningContentsProps {
  warningType: WarningType
  level: AlertLevel
}
export function WarningContents(props: WarningContentsProps): ReactNode {
  const { warningType, level } = props
  const { t } = useTranslation('alert')
  return t(`${level}.warning.${warningType}.body`, {
    defaultValue: '',
  })
}
