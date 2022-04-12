import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  Box,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { StyledText } from '../../../../atoms/text'
import { ToggleButton } from '../../../../atoms/Buttons'

export function DisableHoming(): JSX.Element {
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
          paddingBottom={SPACING.spacing3}
          id="AdvancedSettings_disableHoming"
        >
          {t('disable_homing')}
        </StyledText>

        <StyledText as="p">{t('disable_homing_description')}</StyledText>
      </Box>
      <ToggleButton
        label="disable_homing"
        toggledOn={dummyForToggle}
        onClick={dummyForToggle}
        id="AdvancedSettings_unavailableRobotsToggleButton"
      />
    </Flex>
  )
}
