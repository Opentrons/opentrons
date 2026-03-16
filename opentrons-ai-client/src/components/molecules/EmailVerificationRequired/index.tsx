import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth0 } from '@auth0/auth0-react'
import { useAtom } from 'jotai'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  Link as LinkButton,
  PrimaryButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { emailVerifiedAtom } from '/ai-client/resources/atoms'
import { isEmailVerifiedFromClaims } from '/ai-client/resources/emailVerifiedClaim'
import { useGetAccessToken } from '/ai-client/resources/hooks'

export function EmailVerificationRequired(): JSX.Element {
  const { t } = useTranslation('shared')
  const { logout, getIdTokenClaims } = useAuth0()
  const { getAccessToken } = useGetAccessToken()
  const [, setEmailVerified] = useAtom(emailVerifiedAtom)
  const [isChecking, setIsChecking] = useState(false)
  const [showNotVerified, setShowNotVerified] = useState(false)

  const handleCheckVerification = async (): Promise<void> => {
    setIsChecking(true)
    setShowNotVerified(false)
    try {
      // Force a fresh token from Auth0, bypassing cache — this re-runs the
      // Post-Login Action, which injects the current email_verified value.
      await getAccessToken(true)
      const claims = await getIdTokenClaims()
      if (isEmailVerifiedFromClaims(claims ?? undefined)) {
        setEmailVerified(true)
      } else {
        setShowNotVerified(true)
      }
    } catch {
      setShowNotVerified(true)
    } finally {
      setIsChecking(false)
    }
  }

  const handleLogout = (): void => {
    void logout()
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_CENTER}
      alignItems={ALIGN_CENTER}
      height="100vh"
      backgroundColor={COLORS.grey10}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        alignItems={ALIGN_CENTER}
        gridGap={SPACING.spacing24}
        backgroundColor={COLORS.white}
        borderRadius={BORDERS.borderRadius12}
        padding={SPACING.spacing40}
        maxWidth="28rem"
        width="100%"
      >
        <Icon name="alert-circle" size="2.5rem" color={COLORS.yellow50} />
        <Flex
          flexDirection={DIRECTION_COLUMN}
          alignItems={ALIGN_CENTER}
          gridGap={SPACING.spacing8}
        >
          <StyledText desktopStyle="headingSmallBold" textAlign="center">
            {t('email_verification_required_title')}
          </StyledText>
          <StyledText
            desktopStyle="bodyDefaultRegular"
            color={COLORS.grey60}
            textAlign="center"
          >
            {t('email_verification_required_body')}
          </StyledText>
        </Flex>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          alignItems={ALIGN_CENTER}
          gridGap={SPACING.spacing12}
          width="100%"
        >
          <PrimaryButton
            onClick={() => {
              void handleCheckVerification()
            }}
            width="100%"
            disabled={isChecking}
          >
            {isChecking ? (
              <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
                <Icon name="ot-spinner" size="1rem" spin />
                {t('email_verification_required_check')}
              </Flex>
            ) : (
              t('email_verification_required_check')
            )}
          </PrimaryButton>
          {showNotVerified ? (
            <StyledText
              desktopStyle="bodyDefaultRegular"
              color={COLORS.red50}
              textAlign="center"
            >
              {t('email_verification_required_still_unverified')}
            </StyledText>
          ) : null}
          <LinkButton
            onClick={handleLogout}
            css={`
              color: ${COLORS.grey50};
              font-size: ${TYPOGRAPHY.fontSizeH3};
              cursor: pointer;
            `}
          >
            {t('email_verification_required_logout')}
          </LinkButton>
        </Flex>
      </Flex>
    </Flex>
  )
}
