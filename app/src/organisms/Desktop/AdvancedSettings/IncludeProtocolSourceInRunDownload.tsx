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
  getIncludeProtocolSourceInRunDownload,
  updateConfigValue,
} from '/app/redux/config'

import type { ReactNode } from 'react'
import type { Dispatch } from '/app/redux/types'

export function IncludeProtocolSourceInRunDownload(): ReactNode {
  const { t } = useTranslation('app_settings')
  const dispatch = useDispatch<Dispatch>()
  const includeProtocolSourceInRunDownload = useSelector(
    getIncludeProtocolSourceInRunDownload
  )

  const toggleIncludeProtocolSource = (): void => {
    dispatch(
      updateConfigValue(
        'protocols.includeProtocolSourceInRunDownload',
        Boolean(!includeProtocolSourceInRunDownload)
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
          {t('include_protocol_source_in_run_download')}
        </LegacyStyledText>
        <LegacyStyledText forwardedAs="p">
          {t('include_protocol_source_in_run_download_description')}
        </LegacyStyledText>
      </Box>
      <ToggleButton
        label="include_protocol_source_in_run_download"
        toggledOn={includeProtocolSourceInRunDownload}
        onClick={toggleIncludeProtocolSource}
      />
    </Flex>
  )
}
