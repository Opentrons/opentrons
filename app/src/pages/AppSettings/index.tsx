import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Redirect, useParams } from 'react-router-dom'

import {
  ALIGN_START,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_ROW,
  Flex,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import * as Config from '../../redux/config'
import { GeneralSettings } from './GeneralSettings'
import { AdvancedSettings } from './AdvancedSettings'
import { FeatureFlags } from '../../organisms/AppSettings/FeatureFlags'
import { NavTab } from '../../molecules/NavTab'
import { StyledText } from '../../atoms/text'
import { Line } from '../../atoms/structure'

import type { DesktopRouteParams, AppSettingsTab } from '../../App/types'

export function AppSettings(): JSX.Element {
  const { t } = useTranslation('app_settings')
  const devToolsOn = useSelector(Config.getDevtoolsEnabled)
  const { appSettingsTab } = useParams<DesktopRouteParams>()

  const appSettingsContentByTab: {
    [K in AppSettingsTab]: JSX.Element
  } = {
    general: <GeneralSettings />,
    advanced: <AdvancedSettings />,
    'feature-flags': <FeatureFlags />,
  }

  const appSettingsContent = appSettingsContentByTab[appSettingsTab] ?? (
    // default to the general tab if no tab or nonexistent tab is passed as a param
    <Redirect to="/app-settings/general" />
  )

  return (
    <Flex paddingX={SPACING.spacing16} paddingY={SPACING.spacing16}>
      <Box
        backgroundColor={COLORS.white}
        height="100%"
        width="100%"
        borderRadius={BORDERS.borderRadiusSize2}
        minHeight="95%"
      >
        <Box padding={SPACING.spacing16} paddingBottom="0">
          <StyledText
            css={TYPOGRAPHY.h1Default}
            paddingBottom={SPACING.spacing24}
          >
            {t('app_settings')}
          </StyledText>
          <Flex
            alignItems={ALIGN_START}
            flexDirection={DIRECTION_ROW}
            gridGap={SPACING.spacing20}
          >
            <NavTab to="/app-settings/general" tabName={t('general')} />
            <NavTab to="/app-settings/advanced" tabName={t('advanced')} />
            {devToolsOn && (
              <NavTab
                to="/app-settings/feature-flags"
                tabName={t('feature_flags')}
              />
            )}
          </Flex>
        </Box>
        <Line />
        {appSettingsContent}
      </Box>
    </Flex>
  )
}
