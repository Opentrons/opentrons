import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'

import {
  Flex,
  Box,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  TYPOGRAPHY,
  SPACING,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { ToggleButton } from '../../atoms/buttons'
import {
  getIsLabwareOffsetCodeSnippetsOn,
  updateConfigValue,
} from '../../redux/config'
import { Dispatch } from '../../redux/types'

export function ShowLabwareOffsetSnippets(): JSX.Element {
  const { t } = useTranslation(['app_settings', 'shared'])
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
        <StyledText
          css={TYPOGRAPHY.h3SemiBold}
          paddingBottom={SPACING.spacing8}
          id="AdvancedSettings_showLink"
        >
          {t('show_labware_offset_snippets')}
        </StyledText>
        <StyledText as="p">
          {t('show_labware_offset_snippets_description')}
        </StyledText>
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
