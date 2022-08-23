import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Banner } from '../../../atoms/Banner'

import {
  INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL,
  INTENT_TIP_LENGTH_IN_PROTOCOL,
  INTENT_CALIBRATE_PIPETTE_OFFSET,
  INTENT_RECALIBRATE_PIPETTE_OFFSET,
} from '../constants'

import type { Intent } from '../types'

interface InvalidationWarningProps {
  intent?: Intent
}
export function InvalidationWarning(
  props: InvalidationWarningProps
): JSX.Element | null {
  const { intent } = props
  const { t } = useTranslation('robot_calibration')
  if (
    intent === INTENT_TIP_LENGTH_IN_PROTOCOL ||
    intent === INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL
  ) {
    return (
      <Banner type="warning">
        {t('tip_length_invalidates_pipette_offset')}
      </Banner>
    )
  } else if (
    intent === INTENT_CALIBRATE_PIPETTE_OFFSET ||
    intent === INTENT_RECALIBRATE_PIPETTE_OFFSET
  ) {
    return (
      <Banner type="warning">{t('pipette_offset_requires_tip_length')}</Banner>
    )
  } else {
    return null
  }
}
