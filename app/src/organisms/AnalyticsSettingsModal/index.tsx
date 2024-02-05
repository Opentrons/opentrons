import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Trans, useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  Flex,
  Icon,
  Link,
  SPACING,
  COLORS,
  TYPOGRAPHY,
  DIRECTION_ROW,
  DIRECTION_COLUMN,
  PrimaryButton,
  JUSTIFY_FLEX_END,
} from '@opentrons/components'
import {
  getAnalyticsOptInSeen,
  toggleAnalyticsOptedIn,
  setAnalyticsOptInSeen,
} from '../../redux/analytics'
import { LegacyModal } from '../../molecules/LegacyModal'
import { StyledText } from '../../atoms/text'
import type { Dispatch } from '../../redux/types'

const PRIVACY_POLICY_LINK = 'https://opentrons.com/privacy-policy'

// TODO(mc, 2020-05-07): move render logic to `state.alerts`
export function AnalyticsSettingsModal(): JSX.Element | null {
  const { t } = useTranslation('shared')
  const dispatch = useDispatch<Dispatch>()
  const seen = useSelector(getAnalyticsOptInSeen)

  const handleClick = (): void => {
    dispatch(setAnalyticsOptInSeen())
    dispatch(toggleAnalyticsOptedIn())
  }

  return seen ? (
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
              i18nKey={t('privacy_body')}
              components={{ block: <StyledText as="p" /> }}
            />
          </Flex>
          <Link
            external
            fontSize={TYPOGRAPHY.fontSizeP}
            css={TYPOGRAPHY.darkLinkLabelSemiBold}
            href={PRIVACY_POLICY_LINK}
          >
            <Flex
              flexDirection={DIRECTION_ROW}
              alignItems={ALIGN_CENTER}
              color={COLORS.blue50}
            >
              {t('opentrons_privacy_policy')}
              <Icon
                marginLeft={SPACING.spacing4}
                name="external-link"
                size="0.75rem"
              />
            </Flex>
          </Link>
        </Flex>
      </Flex>
    </LegacyModal>
  ) : null
}
