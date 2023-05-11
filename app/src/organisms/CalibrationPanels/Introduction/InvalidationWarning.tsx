import { Flex, SPACING, TYPOGRAPHY } from '@opentrons/components'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Banner } from '../../../atoms/Banner'
import { StyledText } from '../../../atoms/text'
import * as Sessions from '../../../redux/sessions'

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
        <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {t('deck_invalidates_pipette_offset')}
        </StyledText>
        <StyledText as="p">
          {t('pipette_offset_recalibrate_both_mounts')}
        </StyledText>
      </>
    )
  } else {
    warningBody = (
      <StyledText as="p">
        {t('tip_length_invalidates_pipette_offset')}
      </StyledText>
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
