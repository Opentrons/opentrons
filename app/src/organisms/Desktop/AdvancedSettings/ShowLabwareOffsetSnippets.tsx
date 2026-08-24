import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  Box,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { ToggleButton } from '/app/atoms/buttons'
import {
  getIsLabwareOffsetCodeSnippetsOn,
  updateConfigValue,
} from '/app/redux/config'

import type { ReactNode } from 'react'
import type { Dispatch } from '/app/redux/types'

export function ShowLabwareOffsetSnippets(): ReactNode {
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
        >
          {t('show_labware_offset_snippets')}
        </LegacyStyledText>
        <LegacyStyledText forwardedAs="p">
          {t('branded:show_labware_offset_snippets_description')}
        </LegacyStyledText>
      </Box>
      <ToggleButton
        label="show_link_to_get_labware_offset_data"
        toggledOn={isLabwareOffsetCodeSnippetsOn}
        onClick={toggleLabwareOffsetData}
      />
    </Flex>
  )
}
