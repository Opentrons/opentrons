import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  PAUSE_UNTIL_RESUME,
  PAUSE_UNTIL_TEMP,
  PAUSE_UNTIL_TIME,
} from '/protocol-designer/constants'
import { getEnableConcurrentModuleActions } from '/protocol-designer/feature-flags/selectors'

import { formatTime } from '../../utils'

import type { FormData } from '/protocol-designer/form-types'

export function useStepText(
  step: FormData
): { text: string; subtext: string | null } {
  const { i18n, t } = useTranslation(['application', 'protocol_steps'])
  const enableConcurrentModuleActions = useSelector(
    getEnableConcurrentModuleActions
  )

  // add empty check to avoid causing undefined issue when calling titleCase
  const text =
    step.stepName !== undefined && step.stepName !== ''
      ? i18n.format(step.stepName, 'titleCase')
      : t(`stepType.${step.stepType}`)

  let subtext = null
  if (enableConcurrentModuleActions && step.stepType === 'pause') {
    // todo(mm, 2025-09-10): Improve FormData typing to make this type-safe.
    if (step.pauseAction === PAUSE_UNTIL_RESUME) {
      subtext = t('protocol_steps:pause.untilResume')
    } else if (step.pauseAction === PAUSE_UNTIL_TEMP) {
      subtext = t('protocol_steps:pause.untilTemperature', {
        temperature: step.pauseTemperature,
      })
    } else if (step.pauseAction === PAUSE_UNTIL_TIME) {
      subtext = t('protocol_steps:pause.forDuration', {
        duration: formatTime(step.pauseTime as string),
      })
    }
  }

  return { text, subtext }
}
