import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  Box,
  TYPOGRAPHY,
  SPACING,
} from '@opentrons/components'
import { StyledText } from '../../../../atoms/text'
import { ToggleButton } from '../../../../atoms/Buttons'

export function LegacySettings(): JSX.Element {
  const { t } = useTranslation('device_settings')
  const dummyForToggle = (): void => {
    console.log('dummyForToggle')
  }
  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <StyledText
          as="h2"
          css={TYPOGRAPHY.h3SemiBold}
          //   paddingBottom={SPACING.spacing3}
          marginBottom={SPACING.spacing4}
          id="AdvancedSettings_showLink"
        >
          {t('legacy_settings')}
        </StyledText>
        <StyledText as="p" css={TYPOGRAPHY.pSemiBold}>
          {t('calibrate_deck')}
        </StyledText>
        <StyledText as="p">{t('calibrate_deck_description')}</StyledText>
      </Box>
      <ToggleButton
        label="show_link_to_get_labware_offset_data"
        toggledOn={dummyForToggle}
        onClick={dummyForToggle}
        id="AdvancedSettings_showLinkToggleButton"
      />
    </Flex>
  )
}
