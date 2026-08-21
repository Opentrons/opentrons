import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'
import { isDocumentedMutationError } from '@opentrons/react-api-client'

import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import { ConnectingNetwork, FailedToConnect } from '../../NetworkSettings'

import type { AxiosError } from 'axios'
import type { SetSettingOption } from '../types'

interface RobotSettingsWifiConnectProps {
  handleConnect: () => void
  isPending: boolean
  isSuccess: boolean
  isError: boolean
  error: AxiosError | null
  resetConfigure: () => void
  selectedSsid: string
  setCurrentOption: SetSettingOption
}

/**
 * Robot settings page managing wifi connect status
 */
export function RobotSettingsWifiConnect({
  handleConnect,
  isPending,
  isSuccess,
  isError,
  error,
  resetConfigure,
  setCurrentOption,
  selectedSsid,
}: RobotSettingsWifiConnectProps): JSX.Element | null {
  const { t } = useTranslation('device_settings')
  const isDocumentedCancel =
    isError && error != null && isDocumentedMutationError(error)

  useEffect(() => {
    if (isDocumentedCancel) {
      resetConfigure()
      setCurrentOption('RobotSettingsSetWifiCred')
    }
  }, [isDocumentedCancel, resetConfigure, setCurrentOption])

  useEffect(() => {
    if (isSuccess) {
      setCurrentOption('RobotSettingsWifi')
    }
  }, [isSuccess, setCurrentOption])

  if (isDocumentedCancel) {
    return null
  } else if (isPending) {
    return (
      <Flex
        flexDirection={DIRECTION_COLUMN}
        height="100%"
        padding={SPACING.spacing40}
      >
        <ConnectingNetwork ssid={selectedSsid} />
      </Flex>
    )
  } else if (isError && error != null) {
    const isInvalidPassword = error.response?.status === 401
    const errorMessage =
      error.message != null && error.message.length > 0 ? error.message : null
    return (
      <Flex flexDirection={DIRECTION_COLUMN} height="100%">
        <ChildNavigation
          header={t('wifi')}
          onClickBack={() => {
            setCurrentOption('RobotSettingsWifi')
          }}
        />
        <Flex
          flex="1"
          flexDirection={DIRECTION_COLUMN}
          padding={SPACING.spacing40}
          paddingTop={SPACING.spacing32}
        >
          <FailedToConnect
            errorMessage={errorMessage}
            selectedSsid={selectedSsid}
            isInvalidPassword={isInvalidPassword}
            handleTryAgain={() => {
              isInvalidPassword
                ? setCurrentOption('RobotSettingsSetWifiCred')
                : handleConnect()
            }}
            handleChangeNetwork={() => {
              setCurrentOption('RobotSettingsWifi')
            }}
          />
        </Flex>
      </Flex>
    )
  } else {
    return null
  }
}
