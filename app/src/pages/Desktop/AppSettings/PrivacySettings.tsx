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
  getAnalyticsOptedIn,
  toggleAnalyticsOptedIn,
} from '/app/redux/analytics'

import type { Dispatch, State } from '/app/redux/types'

export function PrivacySettings(): JSX.Element {
  const { t } = useTranslation('branded')
  const dispatch = useDispatch<Dispatch>()
  const analyticsOptedIn = useSelector((s: State) => getAnalyticsOptedIn(s))

  return (
    <Flex
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_CENTER}
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
        size="2rem"
        toggledOn={analyticsOptedIn}
        onClick={() => dispatch(toggleAnalyticsOptedIn())}
      />
    </Flex>
  )
}
