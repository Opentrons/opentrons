import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import {
  Flex,
  SPACING,
  COLORS,
  DIRECTION_COLUMN,
  JUSTIFY_CENTER,
  TYPOGRAPHY,
} from '@opentrons/components'
import { MediumButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'

import screenImage from '../../assets/images/on-device-display/welcome_background.png'

const IMAGE_ALT = 'Welcome screen background image'

export function Welcome(): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const history = useHistory()

  return (
    <Flex
      padding="4.71875rem 3.75rem"
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_CENTER}
      gridGap={SPACING.spacing12}
    >
      <img alt={IMAGE_ALT} src={screenImage} width="904px" height="189px" />
      <Flex justifyContent={JUSTIFY_CENTER}>
        <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
          {t('welcome_title')}
        </StyledText>
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER}>
        <StyledText
          width="39.875rem"
          textAlign={TYPOGRAPHY.textAlignCenter}
          as="h4"
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          color={COLORS.darkBlack70}
        >
          {t('welcome_description')}
        </StyledText>
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER} marginTop={SPACING.spacing28}>
        <MediumButton
          buttonType="primary"
          buttonText={t('shared:get_started')}
          buttonCategory="rounded"
          onClick={() => history.push('/network-setup')}
        />
      </Flex>
    </Flex>
  )
}
