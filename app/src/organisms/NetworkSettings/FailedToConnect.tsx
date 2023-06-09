import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  Icon,
  BORDERS,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { MediumButton } from '../../atoms/buttons'

import type { SetSettingOption } from '../../pages/OnDeviceDisplay/RobotSettingsDashboard'
import type { RequestState } from '../../redux/robot-api/types'

interface FailedToConnectProps {
  selectedSsid: string
  requestState: RequestState | null
  handleConnect: () => void
  setCurrentOption: SetSettingOption
}

export function FailedToConnect({
  selectedSsid,
  requestState,
  setCurrentOption,
  handleConnect,
}: FailedToConnectProps): JSX.Element {
  const { i18n, t } = useTranslation(['device_settings', 'shared'])
  // TODO(bh, 2023-6-9): parse the error/failed request
  // const isInvalidPassword = !(type === DISCONNECT)
  const isInvalidPassword = true

  const handleClickTryAgain = (): void => {
    if (isInvalidPassword) {
      setCurrentOption('RobotSettingsSetWifiCred')
    } else {
      // Try to reconnect
      handleConnect()
    }
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <StyledText
        as="h2"
        fontWeight={TYPOGRAPHY.fontWeightBold}
        marginBottom="4rem"
        textAlign={TYPOGRAPHY.textAlignCenter}
      >
        {t('wifi')}
      </StyledText>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
        <Flex
          height="18.5rem"
          backgroundColor={COLORS.red3}
          justifyContent={JUSTIFY_CENTER}
          borderRadius={BORDERS.borderRadiusSize3}
        >
          <Flex
            justifyContent={JUSTIFY_CENTER}
            alignItems={ALIGN_CENTER}
            flexDirection={DIRECTION_COLUMN}
          >
            <Icon
              name="ot-alert"
              size="3rem"
              color={COLORS.red2}
              aria-label={
                isInvalidPassword
                  ? 'failed_to_connect_invalidPassword'
                  : 'failed_to_connect'
              }
            />
            <Flex
              flexDirection={DIRECTION_COLUMN}
              gridGap={SPACING.spacing4}
              justifyContent={JUSTIFY_CENTER}
              alignItems={ALIGN_CENTER}
            >
              <StyledText
                as="h3"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                marginTop={SPACING.spacing40}
              >
                {isInvalidPassword
                  ? t('incorrect_password_for_ssid', { ssid: selectedSsid })
                  : t('failed_to_connect_to_ssid', { ssid: selectedSsid })}
              </StyledText>
              {!isInvalidPassword &&
                requestState != null &&
                'error' in requestState &&
                requestState.error != null &&
                'message' in requestState.error &&
                requestState.error.message != null && (
                  <StyledText marginTop={SPACING.spacing16}>
                    {requestState.error.message}
                  </StyledText>
                )}
            </Flex>
          </Flex>
        </Flex>
        <Flex gridGap={SPACING.spacing8}>
          <MediumButton
            flex="1"
            buttonType="secondary"
            buttonText={t('change_network')}
            onClick={() => setCurrentOption('RobotSettingsWifi')}
          />
          <MediumButton
            flex="1"
            buttonText={i18n.format(t('shared:try_again'), 'capitalize')}
            onClick={handleClickTryAgain}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}
