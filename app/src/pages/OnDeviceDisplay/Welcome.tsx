import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import {
  Flex,
  SPACING,
  COLORS,
  DIRECTION_COLUMN,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  TYPOGRAPHY,
  PrimaryButton,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'

import screenImage from '../../assets/images/odd/odd_abstract@x2.png'

const IMAGE_ALT = 'Get started setting up a robot'

export function Welcome(): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const history = useHistory()

  return (
    <Flex
      padding={`${String(SPACING.spacing6)} ${String(
        SPACING.spacingXXL
      )} ${String(SPACING.spacingXXL)}`}
      flexDirection={DIRECTION_COLUMN}
    >
      <Flex justifyContent={JUSTIFY_CENTER} marginBottom="3.041875rem">
        <StyledText
          fontSize="2rem"
          fontWeight="700"
          lineHeight="2.75rem"
          color={COLORS.black}
        >
          {t('welcome_title')}
        </StyledText>
      </Flex>
      <Flex height="26.5625rem" justifyContent={JUSTIFY_CENTER}>
        <Flex
          justifyContent={JUSTIFY_CENTER}
          alignItems={ALIGN_CENTER}
          flexDirection={DIRECTION_COLUMN}
        >
          <img alt={IMAGE_ALT} src={screenImage} width="944px" height="236px" />
          <StyledText
            marginTop={SPACING.spacingXXL}
            fontSize="1.375rem"
            lineHeight="1.875rem"
            fontWeight={TYPOGRAPHY.fontWeightRegular}
          >
            {t('welcome_description')}
          </StyledText>
          <PrimaryButton
            marginTop={SPACING.spacingXXL}
            onClick={() => history.push('/network-setup')}
            width="100%"
            height="4.375rem"
            fontSize="1.5rem"
            lineHeight="1.375rem"
          >
            {t('shared:get_started')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </Flex>
  )
}
