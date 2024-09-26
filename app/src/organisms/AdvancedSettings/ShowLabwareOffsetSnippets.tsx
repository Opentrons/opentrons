import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'

import {
  ALIGN_CENTER,
  Box,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { ToggleButton } from '/app/atoms/buttons'
import {
  getIsLabwareOffsetCodeSnippetsOn,
  updateConfigValue,
} from '/app/redux/config'

import type { Dispatch } from '/app/redux/types'

export function ShowLabwareOffsetSnippets(): JSX.Element {
  const { t } = useTranslation(['app_settings', 'shared', 'branded'])
  const dispatch = useDispatch<Dispatch>()
  const isLabwareOffsetCodeSnippetsOn = useSelector(
    getIsLabwareOffsetCodeSnippetsOn
  )

  const toggleLabwareOffsetData = (): void => {
    dispatch(
      updateConfigValue(
        'labware.showLabwareOffsetCodeSnippets',
        Boolean(!isLabwareOffsetCodeSnippetsOn)
      )
    )
  }

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <LegacyStyledText
          css={TYPOGRAPHY.h3SemiBold}
          paddingBottom={SPACING.spacing8}
          id="AdvancedSettings_showLink"
        >
          {t('show_labware_offset_snippets')}
        </LegacyStyledText>
        <LegacyStyledText as="p">
          {t('branded:show_labware_offset_snippets_description')}
        </LegacyStyledText>
      </Box>
      <ToggleButton
        label="show_link_to_get_labware_offset_data"
        toggledOn={isLabwareOffsetCodeSnippetsOn}
        onClick={toggleLabwareOffsetData}
        id="AdvancedSettings_showLinkToggleButton"
      />
    </Flex>
  )
}
