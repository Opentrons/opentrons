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

export function UseOlderProtocol(): JSX.Element {
  const { t } = useTranslation('device_settings')

  const dummyForToggle = (): void => {
    console.log('dummyForToggle')
  }

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      marginBottom={SPACING.spacing5}
    >
      <Box width="70%">
        <StyledText
          as="h3"
          css={TYPOGRAPHY.h3SemiBold}
          paddingBottom={SPACING.spacing3}
          id="AdvancedSettings_showLink"
        >
          {t('use_older_protocol_analysis_method')}
        </StyledText>
        <StyledText as="p">
          {t('use_older_protocol_analysis_method_description')}
        </StyledText>
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
