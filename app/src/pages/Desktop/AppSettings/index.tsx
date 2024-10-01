import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Navigate, useParams } from 'react-router-dom'

import {
  ALIGN_START,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_ROW,
  Flex,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import * as Config from '/app/redux/config'
import { GeneralSettings } from './GeneralSettings'
import { PrivacySettings } from './PrivacySettings'
import { AdvancedSettings } from './AdvancedSettings'
import { FeatureFlags } from '/app/organisms/Desktop/AppSettings/FeatureFlags'
import { NavTab } from '/app/molecules/NavTab'
import { Line } from '/app/atoms/structure'

import type { DesktopRouteParams, AppSettingsTab } from '/app/App/types'

export function AppSettings(): JSX.Element {
  const { t } = useTranslation('app_settings')
  const devToolsOn = useSelector(Config.getDevtoolsEnabled)
  const { appSettingsTab } = useParams<
    keyof DesktopRouteParams
  >() as DesktopRouteParams

  const appSettingsContentByTab: {
    [K in AppSettingsTab]: JSX.Element
  } = {
    general: <GeneralSettings />,
    privacy: <PrivacySettings />,
    advanced: <AdvancedSettings />,
    'feature-flags': <FeatureFlags />,
  }

  const appSettingsContent = appSettingsContentByTab[appSettingsTab] ?? (
    // default to the general tab if no tab or nonexistent tab is passed as a param
    <Navigate to="/app-settings/general" />
  )

  return (
    <Flex paddingX={SPACING.spacing16} paddingY={SPACING.spacing16}>
      <Box
        backgroundColor={COLORS.white}
        height="100%"
        width="100%"
        borderRadius={BORDERS.borderRadius8}
        minHeight="95%"
      >
        <Box padding={SPACING.spacing16} paddingBottom="0">
          <LegacyStyledText
            css={TYPOGRAPHY.h1Default}
            paddingBottom={SPACING.spacing24}
          >
            {t('app_settings')}
          </LegacyStyledText>
          <Flex
            alignItems={ALIGN_START}
            flexDirection={DIRECTION_ROW}
            gridGap={SPACING.spacing20}
          >
            <NavTab to="/app-settings/general" tabName={t('general')} />
            <NavTab to="/app-settings/privacy" tabName={t('privacy')} />
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
