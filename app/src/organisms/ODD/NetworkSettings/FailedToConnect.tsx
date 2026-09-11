import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { MediumButton } from '/app/atoms/buttons'

interface FailedToConnectProps {
  selectedSsid: string
  errorMessage?: string | null
  handleChangeNetwork: () => void
  handleTryAgain: () => void
  isInvalidPassword: boolean
}

export function FailedToConnect({
  selectedSsid,
  errorMessage,
  handleTryAgain,
  handleChangeNetwork,
  isInvalidPassword,
}: FailedToConnectProps): JSX.Element {
  const { i18n, t } = useTranslation(['device_settings', 'shared'])

  return (
    <Flex flex="1" flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
      <Flex
        flex="1"
        backgroundColor={COLORS.red35}
        justifyContent={JUSTIFY_CENTER}
        borderRadius={BORDERS.borderRadius12}
      >
        <Flex
          justifyContent={JUSTIFY_CENTER}
          alignItems={ALIGN_CENTER}
          flexDirection={DIRECTION_COLUMN}
        >
          <Icon
            name="ot-alert"
            size="3rem"
            color={COLORS.red50}
            aria-label="failed_to_connect_invalidPassword"
          />
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing4}
            justifyContent={JUSTIFY_CENTER}
            alignItems={ALIGN_CENTER}
          >
            <LegacyStyledText
              forwardedAs="h3"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              marginTop={SPACING.spacing40}
            >
              {isInvalidPassword
                ? t('incorrect_password_for_ssid', { ssid: selectedSsid })
                : t('failed_to_connect_to_ssid', { ssid: selectedSsid })}
            </LegacyStyledText>
            {!isInvalidPassword && errorMessage != null && (
              <LegacyStyledText marginTop={SPACING.spacing16}>
                {errorMessage}
              </LegacyStyledText>
            )}
          </Flex>
        </Flex>
      </Flex>
      <Flex gridGap={SPACING.spacing8}>
        <MediumButton
          flex="1"
          buttonType="secondary"
          buttonText={t('change_network')}
          onClick={handleChangeNetwork}
        />
        <MediumButton
          flex="1"
          buttonText={i18n.format(t('shared:try_again'), 'capitalize')}
          onClick={handleTryAgain}
        />
      </Flex>
    </Flex>
  )
}
