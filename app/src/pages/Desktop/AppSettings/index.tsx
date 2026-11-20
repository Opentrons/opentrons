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
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { RoundTab } from '/app/molecules/RoundTab'
import { FeatureFlags } from '/app/organisms/Desktop/AppSettings/FeatureFlags'
import * as Config from '/app/redux/config'

import { AdvancedSettings } from './AdvancedSettings'
import { GeneralSettings } from './GeneralSettings'
import { PrivacySettings } from './PrivacySettings'

import type { ReactNode } from 'react'
import type { AppSettingsTab, DesktopRouteParams } from '/app/App/types'

export function AppSettings(): ReactNode {
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
      <Box width="100%" borderRadius={BORDERS.borderRadius8}>
        <Box padding={SPACING.spacing16} paddingBottom={SPACING.spacing16}>
          <LegacyStyledText
            css={TYPOGRAPHY.h1Default}
            paddingBottom={SPACING.spacing24}
          >
            {t('app_settings')}
          </LegacyStyledText>
          <Flex
            alignItems={ALIGN_START}
            flexDirection={DIRECTION_ROW}
            gridGap={SPACING.spacing4}
          >
            <RoundTab
              to="/app-settings/general"
              tabName={t('general')}
              disabled={false}
            />
            <RoundTab
              to="/app-settings/privacy"
              tabName={t('privacy')}
              disabled={false}
            />
            <RoundTab
              to="/app-settings/advanced"
              tabName={t('advanced')}
              disabled={false}
            />
            {devToolsOn && (
              <RoundTab
                to="/app-settings/feature-flags"
                tabName={t('feature_flags')}
                disabled={false}
              />
            )}
          </Flex>
        </Box>
        <Box
          backgroundColor={COLORS.white}
          borderRadius={BORDERS.borderRadius8}
        >
          {appSettingsContent}
        </Box>
      </Box>
    </Flex>
  )
}
