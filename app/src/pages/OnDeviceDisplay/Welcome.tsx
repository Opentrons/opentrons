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
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing12}
      justifyContent={JUSTIFY_CENTER}
      padding="4.71875rem 3.75rem"
    >
      <img alt={IMAGE_ALT} src={screenImage} width="904px" height="189px" />
      <Flex justifyContent={JUSTIFY_CENTER}>
        <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
          {t('welcome_title')}
        </StyledText>
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER}>
        <StyledText
          as="h4"
          color={COLORS.darkBlack70}
          textAlign={TYPOGRAPHY.textAlignCenter}
          width="39.875rem"
        >
          {t('welcome_description')}
        </StyledText>
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER} marginTop="1.75rem">
        <MediumButton
          buttonCategory="rounded"
          buttonText={t('shared:get_started')}
          onClick={() => history.push('/network-setup')}
        />
      </Flex>
    </Flex>
  )
}
