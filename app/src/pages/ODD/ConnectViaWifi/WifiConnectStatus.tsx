import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'
import { isDocumentedMutationError } from '@opentrons/react-api-client'

import {
  ConnectingNetwork,
  FailedToConnect,
  WifiConnectionDetails,
} from '/app/organisms/ODD/NetworkSettings'
import { RobotSetupHeader } from '/app/organisms/ODD/RobotSetupHeader'

import type { AxiosError } from 'axios'
import type { WifiSecurityType } from '@opentrons/api-client'
import type { WifiScreenOption } from './'

interface WifiConnectStatusProps {
  handleConnect: () => void
  isPending: boolean
  isSuccess: boolean
  isError: boolean
  error: AxiosError | null
  resetConfigure: () => void
  selectedSsid: string
  setCurrentOption: (option: WifiScreenOption) => void
  selectedAuthType: WifiSecurityType
}

export function WifiConnectStatus({
  handleConnect,
  isPending,
  isSuccess,
  isError,
  error,
  resetConfigure,
  setCurrentOption,
  selectedSsid,
  selectedAuthType,
}: WifiConnectStatusProps): JSX.Element | null {
  const { t } = useTranslation('device_settings')
  const isDocumentedCancel =
    isError && error != null && isDocumentedMutationError(error)

  useEffect(() => {
    if (isDocumentedCancel) {
      resetConfigure()
      setCurrentOption(
        selectedAuthType === 'none' ? 'SelectAuthType' : 'SetWifiCred'
      )
    }
  }, [
    isDocumentedCancel,
    resetConfigure,
    selectedAuthType,
    setCurrentOption,
  ])

  if (isDocumentedCancel) {
    return null
  } else if (isPending) {
    return (
      <Flex padding={SPACING.spacing40} flex="1">
        <ConnectingNetwork ssid={selectedSsid} />
      </Flex>
    )
  } else if (isError && error != null) {
    const isInvalidPassword = error.response?.status === 401
    const errorMessage =
      error.message != null && error.message.length > 0 ? error.message : null
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
            errorMessage={errorMessage}
            selectedSsid={selectedSsid}
            handleTryAgain={() => {
              isInvalidPassword
                ? setCurrentOption('SetWifiCred')
                : handleConnect()
            }}
            isInvalidPassword={isInvalidPassword}
            handleChangeNetwork={() => {
              setCurrentOption('WifiList')
            }}
          />
        </Flex>
      </>
    )
  } else if (isSuccess) {
    return (
      <WifiConnectionDetails ssid={selectedSsid} authType={selectedAuthType} />
    )
  } else {
    return null
  }
}
