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
  clearDevInternalFlags,
  getDevtoolsEnabled,
  toggleDevtools,
} from '/app/redux/config'

import type { ReactNode } from 'react'
import type { Dispatch } from '/app/redux/types'

export function EnableDevTools(): ReactNode {
  const { t } = useTranslation('app_settings')
  const devToolsOn = useSelector(getDevtoolsEnabled)
  const dispatch = useDispatch<Dispatch>()
  const toggleDevTools = (): void => {
    if (devToolsOn) {
      dispatch(clearDevInternalFlags())
    }
    dispatch(toggleDevtools())
  }

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <LegacyStyledText
          css={TYPOGRAPHY.h3SemiBold}
          paddingBottom={SPACING.spacing8}
        >
          {t('enable_dev_tools')}
        </LegacyStyledText>
        <LegacyStyledText forwardedAs="p">
          {t('enable_dev_tools_description')}
        </LegacyStyledText>
      </Box>
      <ToggleButton
        label="enable_dev_tools"
        toggledOn={devToolsOn}
        onClick={toggleDevTools}
      />
    </Flex>
  )
}
