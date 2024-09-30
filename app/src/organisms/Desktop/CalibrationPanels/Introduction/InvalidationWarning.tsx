import {
  Flex,
  Banner,
  SPACING,
  TYPOGRAPHY,
  LegacyStyledText,
} from '@opentrons/components'
import { useTranslation } from 'react-i18next'
import * as Sessions from '/app/redux/sessions'

interface InvalidationWarningProps {
  sessionType:
    | typeof Sessions.SESSION_TYPE_DECK_CALIBRATION
    | typeof Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION
}

export function InvalidationWarning(
  props: InvalidationWarningProps
): JSX.Element {
  const { sessionType } = props
  const { t } = useTranslation('robot_calibration')
  let warningBody: JSX.Element

  if (sessionType === Sessions.SESSION_TYPE_DECK_CALIBRATION) {
    warningBody = (
      <>
        <LegacyStyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {t('deck_invalidates_pipette_offset')}
        </LegacyStyledText>
        <LegacyStyledText as="p">
          {t('pipette_offset_recalibrate_both_mounts')}
        </LegacyStyledText>
      </>
    )
  } else {
    warningBody = (
      <LegacyStyledText as="p">
        {t('tip_length_invalidates_pipette_offset')}
      </LegacyStyledText>
    )
  }

  return (
    <Banner type="warning">
      <Flex flexDirection="column" paddingRight={SPACING.spacing16}>
        {warningBody}
      </Flex>
    </Banner>
  )
}
