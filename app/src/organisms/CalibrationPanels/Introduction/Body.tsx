import { Trans, useTranslation } from 'react-i18next'
import { LegacyStyledText } from '@opentrons/components'
import * as Sessions from '/app/redux/sessions'

import type { SessionType } from '/app/redux/sessions/types'

interface BodyProps {
  sessionType: SessionType
}
export function Body(props: BodyProps): JSX.Element | null {
  const { sessionType } = props
  const { t } = useTranslation('robot_calibration')
  switch (sessionType) {
    case Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK:
      return (
        <Trans
          t={t}
          i18nKey="calibration_health_check_intro_body"
          components={{ block: <LegacyStyledText as="p" /> }}
        />
      )
    case Sessions.SESSION_TYPE_DECK_CALIBRATION:
      return (
        <LegacyStyledText as="p">
          {t('deck_calibration_intro_body')}
        </LegacyStyledText>
      )
    case Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION:
      return (
        <LegacyStyledText as="p">
          {t('pipette_offset_calibration_intro_body')}
        </LegacyStyledText>
      )
    case Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION:
      return (
        <LegacyStyledText as="p">
          {t('tip_length_calibration_intro_body')}
        </LegacyStyledText>
      )
    default:
      // this case should never be reached
      console.warn(
        'Introduction Calibration Panel received invalid session type'
      )
      return null
  }
}
