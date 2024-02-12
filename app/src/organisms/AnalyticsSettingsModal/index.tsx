import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Trans, useTranslation } from 'react-i18next'
import {
  Flex,
  SPACING,
  TYPOGRAPHY,
  DIRECTION_COLUMN,
  PrimaryButton,
  JUSTIFY_FLEX_END,
} from '@opentrons/components'
import {
  getAnalyticsOptInSeen,
  toggleAnalyticsOptedIn,
  setAnalyticsOptInSeen,
  getAnalyticsOptedIn,
} from '../../redux/analytics'
import { ExternalLink } from '../../atoms/Link/ExternalLink'
import { LegacyModal } from '../../molecules/LegacyModal'
import { StyledText } from '../../atoms/text'
import type { Dispatch } from '../../redux/types'

const PRIVACY_POLICY_LINK = 'https://opentrons.com/privacy-policy'

// TODO(mc, 2020-05-07): move render logic to `state.alerts`
export function AnalyticsSettingsModal(): JSX.Element | null {
  const { t } = useTranslation('shared')
  const dispatch = useDispatch<Dispatch>()
  const seen = useSelector(getAnalyticsOptInSeen)
  const hasOptedIn = useSelector(getAnalyticsOptedIn)

  const handleClick = (): void => {
    dispatch(setAnalyticsOptInSeen())
    dispatch(toggleAnalyticsOptedIn())
  }

  return !seen || !hasOptedIn ? (
    <LegacyModal
      title={
        <StyledText css={TYPOGRAPHY.h3SemiBold}>
          {t('acknowledge_privacy')}
        </StyledText>
      }
      footer={
        <Flex
          justifyContent={JUSTIFY_FLEX_END}
          paddingRight={SPACING.spacing16}
          paddingBottom={SPACING.spacing16}
        >
          <PrimaryButton onClick={handleClick}>
            <StyledText as="p">{t('agree')}</StyledText>
          </PrimaryButton>
        </Flex>
      }
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Flex gridGap={SPACING.spacing10} flexDirection={DIRECTION_COLUMN}>
          <Flex gridGap={SPACING.spacing10} flexDirection={DIRECTION_COLUMN}>
            <Trans
              t={t}
              i18nKey="privacy_body"
              components={{ block: <StyledText as="p" /> }}
            />
          </Flex>
          <ExternalLink href={PRIVACY_POLICY_LINK}>
            {t('opentrons_privacy_policy')}
          </ExternalLink>
        </Flex>
      </Flex>
    </LegacyModal>
  ) : null
}
