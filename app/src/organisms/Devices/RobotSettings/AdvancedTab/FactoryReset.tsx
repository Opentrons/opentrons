import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  Box,
  SPACING,
  SPACING_AUTO,
  TYPOGRAPHY,
} from '@opentrons/components'
import { StyledText } from '../../../../atoms/text'
import { TertiaryButton } from '../../../../atoms/Buttons'

export function FactoryReset(): JSX.Element {
  const { t } = useTranslation('device_settings')
  const dummyForToggle = (): void => {
    console.log('dummyForToggle')
  }

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <StyledText
          as="h3"
          css={TYPOGRAPHY.h3SemiBold}
          marginBottom={SPACING.spacing4}
          id="AdvancedSettings_factoryReset"
        >
          {t('factory_reset')}
        </StyledText>
        <StyledText as="p">{t('factory_reset_description')}</StyledText>
      </Box>
      <TertiaryButton
        marginLeft={SPACING_AUTO}
        onClick={null} // ToDo add slideout
        id="AdvancedSettings_FactoryResetChooseButton"
      >
        {t('factory_reset_settings_button')}
      </TertiaryButton>
    </Flex>
  )
}
