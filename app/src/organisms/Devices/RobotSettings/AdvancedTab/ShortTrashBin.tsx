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

export function ShortTrashBin(): JSX.Element {
  const { t } = useTranslation('device_settings')
  const dummyForToggle = (): void => {
    console.log('dummyForToggle')
  }

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <StyledText
          css={TYPOGRAPHY.h3SemiBold}
          paddingBottom={SPACING.spacing3}
          id="AdvancedSettings_devTools"
        >
          {t('short_trash_bin')}
        </StyledText>
        <StyledText css={TYPOGRAPHY.pRegular}>
          {t('short_trash_bin_description')}
        </StyledText>
      </Box>
      <ToggleButton
        label="enable_dev_tools"
        toggledOn={dummyForToggle}
        onClick={dummyForToggle}
        id="AdvancedSettings_shortTrashBin"
      />
    </Flex>
  )
}
