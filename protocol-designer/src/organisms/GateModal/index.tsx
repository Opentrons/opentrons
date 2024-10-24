import { Trans, useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_END,
  Link as LinkComponent,
  Modal,
  PrimaryButton,
  SPACING,
  SecondaryButton,
  StyledText,
} from '@opentrons/components'
import {
  actions as analyticsActions,
  selectors as analyticsSelectors,
} from '../../analytics'

const PRIVACY_POLICY_URL = 'https://opentrons.com/privacy-policy'
const EULA_URL = 'https://opentrons.com/eula'

export function GateModal(): JSX.Element | null {
  const { t } = useTranslation('shared')
  const hasOptedIn = useSelector(analyticsSelectors.getHasOptedIn)
  const dispatch = useDispatch()

  if (hasOptedIn == null) {
    return (
      <Modal
        position="bottomRight"
        showOverlay={false}
        footer={
          <Flex
            justifyContent={JUSTIFY_END}
            gridGap={SPACING.spacing8}
            padding={SPACING.spacing24}
          >
            <SecondaryButton
              onClick={() => dispatch(analyticsActions.optOut())}
            >
              <StyledText desktopStyle="bodyDefaultRegular">
                {t('reject')}
              </StyledText>
            </SecondaryButton>
            <PrimaryButton onClick={() => dispatch(analyticsActions.optIn())}>
              <StyledText desktopStyle="bodyDefaultRegular">
                {t('agree')}
              </StyledText>
            </PrimaryButton>
          </Flex>
        }
      >
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('opentrons_collects_data')}
          </StyledText>
          <StyledText desktopStyle="bodyDefaultRegular">
            <Trans
              t={t}
              i18nKey="review_our_privacy_policy"
              components={{
                link1: (
                  <LinkComponent
                    external
                    href={PRIVACY_POLICY_URL}
                    color={COLORS.blue50}
                  />
                ),
              }}
            />
          </StyledText>
          <StyledText desktopStyle="bodyDefaultRegular">
            <Trans
              t={t}
              i18nKey="consent_to_eula"
              components={{
                link1: (
                  <LinkComponent
                    external
                    href={EULA_URL}
                    color={COLORS.blue50}
                  />
                ),
              }}
            />
          </StyledText>
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('analytics_tracking')}
          </StyledText>
        </Flex>
      </Modal>
    )
  } else {
    return null
  }
}
