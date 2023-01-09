import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

import {
  Flex,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  Icon,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { PrimaryButton, SecondaryButton } from '../../atoms/buttons'
import { DISCONNECT } from '../Devices/RobotSettings/ConnectNetwork/constants'

import type { RequestState } from '../../redux/robot-api/types'
import type { NetworkChangeType } from '../Devices/RobotSettings/ConnectNetwork/types'

interface FailedToConnectProps {
  ssid: string
  requestState?: RequestState
  type: NetworkChangeType | null
  onConnect: () => void
  handleShowSetWifiCred: (isShow: boolean) => void
}

export function FailedToConnect({
  ssid,
  requestState,
  type,
  onConnect,
  handleShowSetWifiCred,
}: FailedToConnectProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const history = useHistory()
  const isInvalidPassword = type === DISCONNECT

  const handleClick = (): void => {
    if (!isInvalidPassword) {
      // Try to reconnect
      onConnect()
    } else {
      // Display SetWifiCred screen
      handleShowSetWifiCred(true)
    }
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Flex
        height="26.5625rem"
        backgroundColor={COLORS.errorBackgroundMed}
        justifyContent={JUSTIFY_CENTER}
        marginBottom={SPACING.spacing6}
      >
        <Flex
          justifyContent={JUSTIFY_CENTER}
          alignItems={ALIGN_CENTER}
          flexDirection={DIRECTION_COLUMN}
        >
          <Icon
            name="ot-alert"
            size="4.375rem"
            color={COLORS.errorEnabled}
            aria-label={
              !isInvalidPassword
                ? 'failed_to_connect_invalidPassword'
                : 'failed_to_connect'
            }
          />
          <StyledText
            fontSize="2rem"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            lineHeight="2.72375rem"
            marginTop={SPACING.spacingXXL}
          >
            {!isInvalidPassword
              ? `Oops! Incorrect password for ${ssid}.`
              : t('failed_to_connect_to_ssid', { ssid: ssid })}
          </StyledText>
          {isInvalidPassword &&
            requestState != null &&
            'error' in requestState &&
            requestState.error != null &&
            'message' in requestState.error &&
            requestState.error.message != null && (
              <StyledText marginTop={SPACING.spacing4}>
                {requestState.error.message}
              </StyledText>
            )}
        </Flex>
      </Flex>
      <Flex gridRow="0.75rem">
        <SecondaryButton
          flex="1"
          onClick={handleClick}
          textTransform={TYPOGRAPHY.textTransformCapitalize}
        >
          {t('shared:try_again')}
        </SecondaryButton>
        <PrimaryButton
          flex="1"
          onClick={() => history.push('/network-setup/wifi')}
        >
          {t('change_network')}
        </PrimaryButton>
      </Flex>
    </Flex>
  )
}
