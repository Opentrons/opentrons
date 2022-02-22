import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import {
  Text,
  Box,
  Flex,
  ALIGN_START,
  DIRECTION_ROW,
  BORDERS,
  SPACING,
  TYPOGRAPHY,
  COLORS,
} from '@opentrons/components'
import * as Config from '../../redux/config'

import { Divider } from '../../atoms/structure'

interface AppSettingsHeaderProps {
  page: 'general' | 'privacy' | 'advanced' | 'featureFlags'
}

export function AppSettingsHeader(props: AppSettingsHeaderProps): JSX.Element {
  const { t } = useTranslation('app_settings')
  const devToolsOn = useSelector(Config.getDevtoolsEnabled)

  return (
    <>
      <Box padding={SPACING.spacing4} paddingBottom="0">
        <Text css={TYPOGRAPHY.h1Default} paddingBottom={SPACING.spacing5}>
          {t('app_settings')}
        </Text>
        <Flex alignItems={ALIGN_START} flexDirection={DIRECTION_ROW}>
          <Link to="/app-settings/general">
            <Box
              marginRight={SPACING.spacing4}
              css={props.page === 'general' ? BORDERS.tabBorder : ''}
            >
              <Text
                css={TYPOGRAPHY.labelSemiBold}
                color={COLORS.darkBlack}
                paddingBottom={SPACING.spacing3}
                marginX={SPACING.spacing2}
              >
                {t('general')}
              </Text>
            </Box>
          </Link>
          <Link to="/app-settings/privacy">
            <Box
              marginRight={SPACING.spacing4}
              css={props.page === 'privacy' ? BORDERS.tabBorder : ''}
            >
              <Text
                css={TYPOGRAPHY.labelSemiBold}
                color={COLORS.darkBlack}
                paddingBottom={SPACING.spacing3}
                marginX={SPACING.spacing2}
              >
                {t('privacy')}
              </Text>
            </Box>
          </Link>
          <Link to="/app-settings/advanced">
            <Box
              marginRight={SPACING.spacing4}
              css={props.page === 'advanced' ? BORDERS.tabBorder : ''}
            >
              <Text
                css={TYPOGRAPHY.labelSemiBold}
                color={COLORS.darkBlack}
                paddingBottom={SPACING.spacing3}
                marginX={SPACING.spacing2}
              >
                {t('advanced')}
              </Text>
            </Box>
          </Link>
          {devToolsOn && (
            <Link to="/app-settings/feature-flags">
              <Box
                marginRight={SPACING.spacing4}
                css={props.page === 'featureFlags' ? BORDERS.tabBorder : ''}
              >
                <Text
                  css={TYPOGRAPHY.labelSemiBold}
                  color={COLORS.darkBlack}
                  paddingBottom={SPACING.spacing3}
                  marginX={SPACING.spacing2}
                >
                  {t('feature_flags')}
                </Text>
              </Box>
            </Link>
          )}
        </Flex>
      </Box>
      <Divider marginTop="0" />
    </>
  )
}
