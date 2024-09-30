import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { MediumButton } from '/app/atoms/buttons'

import screenImage from '/app/assets/images/on-device-display/welcome_background.png'

const IMAGE_ALT = 'Welcome screen background image'

export function Welcome(): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared', 'branded'])
  const navigate = useNavigate()

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing12}
      justifyContent={JUSTIFY_CENTER}
      padding="4.71875rem 3.75rem"
    >
      <img alt={IMAGE_ALT} src={screenImage} width="904px" height="189px" />
      <Flex justifyContent={JUSTIFY_CENTER}>
        <LegacyStyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
          {t('branded:welcome_title')}
        </LegacyStyledText>
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER}>
        <LegacyStyledText
          as="h4"
          color={COLORS.grey60}
          textAlign={TYPOGRAPHY.textAlignCenter}
          width="39.875rem"
        >
          {t('welcome_description')}
        </LegacyStyledText>
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER} marginTop="1.75rem">
        <MediumButton
          buttonCategory="rounded"
          buttonText={t('shared:get_started')}
          onClick={() => {
            navigate('/network-setup')
          }}
        />
      </Flex>
    </Flex>
  )
}
