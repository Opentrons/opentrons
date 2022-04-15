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

interface FactoryResetProps {
  robotName: string
}

export function FactoryReset({ robotName }: FactoryResetProps): JSX.Element {
  const { t } = useTranslation('device_settings')

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
        onClick={null}
        id="RobotSettings_FactoryResetChooseButton"
      >
        {t('factory_reset_settings_button')}
      </TertiaryButton>
    </Flex>
  )
}
