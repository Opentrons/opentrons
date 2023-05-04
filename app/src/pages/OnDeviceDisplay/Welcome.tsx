import screenImage from '../../assets/images/on-device-display/welcome_background.png'
import { SmallButton } from '../../atoms/buttons/OnDeviceDisplay'
import { StyledText } from '../../atoms/text'
import {
  Flex,
  SPACING,
  COLORS,
  DIRECTION_COLUMN,
  JUSTIFY_CENTER,
  TYPOGRAPHY,
} from '@opentrons/components'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

const IMAGE_ALT = 'Welcome screen background image'

export function Welcome(): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const history = useHistory()

  return (
    <Flex
      padding="4.71875rem 3.75rem"
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_CENTER}
      gridGap="0.75rem"
    >
      <img alt={IMAGE_ALT} src={screenImage} width="904px" height="189px" />
      <Flex justifyContent={JUSTIFY_CENTER}>
        <StyledText
          fontSize={TYPOGRAPHY.fontSize38}
          fontWeight={TYPOGRAPHY.fontWeightBold}
          lineHeight={TYPOGRAPHY.lineHeight48}
        >
          {t('welcome_title')}
        </StyledText>
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER}>
        <StyledText
          width="39.875rem"
          textAlign={TYPOGRAPHY.textAlignCenter}
          fontSize={TYPOGRAPHY.fontSize28}
          lineHeight={TYPOGRAPHY.lineHeight36}
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          color={COLORS.darkBlack_seventy}
        >
          {t('welcome_description')}
        </StyledText>
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER} marginTop={SPACING.spacing40}>
        <SmallButton
          buttonType="primary"
          buttonText={t('shared:get_started')}
          buttonCategory="rounded"
          onClick={() => history.push('/network-setup')}
        />
      </Flex>
    </Flex>
  )
}
