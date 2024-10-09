import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'

import {
  Box,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SIZE_2,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import {
  toggleAnalyticsOptedIn,
  getAnalyticsOptedIn,
} from '/app/redux/analytics'
import { ToggleButton } from '/app/atoms/buttons'

import type { Dispatch, State } from '/app/redux/types'

export function PrivacySettings(): JSX.Element {
  const { t } = useTranslation('branded')
  const dispatch = useDispatch<Dispatch>()
  const analyticsOptedIn = useSelector((s: State) => getAnalyticsOptedIn(s))

  return (
    <Flex
      height="calc(100vh - 8.5rem)"
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      paddingX={SPACING.spacing16}
      paddingY={SPACING.spacing24}
      gridGap={SPACING.spacing16}
    >
      <Box width="70%">
        <LegacyStyledText
          css={TYPOGRAPHY.h3SemiBold}
          paddingBottom={SPACING.spacing8}
        >
          {t('share_app_analytics')}
        </LegacyStyledText>
        <LegacyStyledText
          css={TYPOGRAPHY.pRegular}
          paddingBottom={SPACING.spacing8}
        >
          {t('share_app_analytics_description')}
        </LegacyStyledText>
      </Box>
      <ToggleButton
        label="analytics_opt_in"
        size={SIZE_2}
        toggledOn={analyticsOptedIn}
        onClick={() => dispatch(toggleAnalyticsOptedIn())}
        id="PrivacySettings_analytics"
      />
    </Flex>
  )
}
