import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'

import {
  ALIGN_CENTER,
  Box,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { ToggleButton } from '../../atoms/buttons'
import { getDevtoolsEnabled, toggleDevtools } from '../../redux/config'

import type { Dispatch } from '../../redux/types'

export function EnableDevTools(): JSX.Element {
  const { t } = useTranslation('app_settings')
  const devToolsOn = useSelector(getDevtoolsEnabled)
  const dispatch = useDispatch<Dispatch>()
  const toggleDevTools = (): unknown => dispatch(toggleDevtools())

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <StyledText
          css={TYPOGRAPHY.h3SemiBold}
          paddingBottom={SPACING.spacing8}
          id="AdvancedSettings_devTools"
        >
          {t('enable_dev_tools')}
        </StyledText>
        <StyledText as="p">{t('enable_dev_tools_description')}</StyledText>
      </Box>
      <ToggleButton
        label="enable_dev_tools"
        toggledOn={devToolsOn}
        onClick={toggleDevTools}
        id="AdvancedSettings_devTooltoggle"
      />
    </Flex>
  )
}
