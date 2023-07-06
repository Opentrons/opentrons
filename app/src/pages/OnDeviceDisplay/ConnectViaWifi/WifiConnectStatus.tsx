import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { Flex, DIRECTION_COLUMN, SPACING } from '@opentrons/components'

import {
  ConnectingNetwork,
  FailedToConnect,
  WifiConnectionDetails,
} from '../../../organisms/NetworkSettings'
import { RobotSetupHeader } from '../../../organisms/RobotSetupHeader'
import * as RobotApi from '../../../redux/robot-api'

import type { WifiSecurityType } from '@opentrons/api-client'
import type { RequestState } from '../../../redux/robot-api/types'
import type { WifiScreenOption } from '.'

interface WifiConnectStatusProps {
  handleConnect: () => void
  requestState: RequestState | null
  selectedSsid: string
  setCurrentOption: (option: WifiScreenOption) => void
  selectedAuthType: WifiSecurityType
}

export function WifiConnectStatus({
  handleConnect,
  requestState,
  setCurrentOption,
  selectedSsid,
  selectedAuthType,
}: WifiConnectStatusProps): JSX.Element | null {
  const { t } = useTranslation('device_settings')

  if (requestState == null) {
    return null
  } else if (requestState.status === RobotApi.PENDING) {
    return (
      <Flex padding={SPACING.spacing40} flex="1">
        <ConnectingNetwork ssid={selectedSsid} />
      </Flex>
    )
  } else if (requestState.status === RobotApi.FAILURE) {
    const isInvalidPassword = requestState.response.status === 401
    return (
      <>
        <RobotSetupHeader header={t('wifi')} />
        <Flex
          flexDirection={DIRECTION_COLUMN}
          flex="1"
          padding={SPACING.spacing40}
          paddingTop={SPACING.spacing32}
        >
          <FailedToConnect
            requestState={requestState}
            selectedSsid={selectedSsid}
            handleTryAgain={() =>
              isInvalidPassword
                ? setCurrentOption('SetWifiCred')
                : handleConnect()
            }
            isInvalidPassword={isInvalidPassword}
            handleChangeNetwork={() => setCurrentOption('WifiList')}
          />
        </Flex>
      </>
    )
  } else if (requestState.status === RobotApi.SUCCESS) {
    return (
      <WifiConnectionDetails ssid={selectedSsid} authType={selectedAuthType} />
    )
  } else {
    return null
  }
}
