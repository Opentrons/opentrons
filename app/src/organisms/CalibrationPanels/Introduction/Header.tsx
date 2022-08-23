
import * as React from 'react'
import { useTranslation } from 'react-i18next'

import * as Sessions from '../../../redux/sessions'
import { StyledText } from '../../../atoms/text'

import type { SessionType } from '../../../redux/sessions/types'
import type { Intent } from '../types'


interface IntroHeaderProps {
  sessionType: SessionType
  isExtendedPipOffset?: boolean | null
  intent?: Intent
}
export function Header(props: IntroHeaderProps): JSX.Element {
  const { sessionType, isExtendedPipOffset, intent } = props
  const { t } = useTranslation('robot_calibration')
  let headerText = null
  switch (sessionType) {
    case Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK:
      headerText = t('calibration_health_check')
      break
    case Sessions.SESSION_TYPE_DECK_CALIBRATION:
      headerText = t('deck_calibration')
      break
    case Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION:
      if (isExtendedPipOffset && intent != null) {
        headerText = t('tip_length_and_pipette_offset_calibration')
      } else {
        headerText = t('pipette_offset_calibration')
      }
      break
    case Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION:
      headerText = t('tip_length_calibration')
      break
  }
  return <StyledText as="h3">{headerText}</StyledText>
}

