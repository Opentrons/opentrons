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

export function UseOlderAspirateBehavior(): JSX.Element {
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
          id="AdvancedSettings_devTools"
        >
          {t('use_older_aspirate')}
        </StyledText>
        <StyledText as="p">{t('use_older_aspirate_description')}</StyledText>
      </Box>
      <ToggleButton
        label="enable_dev_tools"
        toggledOn={dummyForToggle}
        onClick={dummyForToggle}
        id="AdvancedSettings_useOlderAspirate"
      />
    </Flex>
  )
}
