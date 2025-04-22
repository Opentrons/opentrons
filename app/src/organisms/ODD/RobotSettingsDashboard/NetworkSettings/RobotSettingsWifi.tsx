import { useTranslation } from 'react-i18next'
import { DIRECTION_COLUMN, Flex } from '@opentrons/components'

import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import { WifiConnectionDetails } from './WifiConnectionDetails'

import type { SetSettingOption } from '../types'
import type { WifiSecurityType } from '@opentrons/api-client'
import type { Dispatch, SetStateAction } from 'react'

interface RobotSettingsWifiProps {
  setSelectedSsid: Dispatch<SetStateAction<string>>
  setCurrentOption: SetSettingOption
  activeSsid?: string
  connectedWifiAuthType?: WifiSecurityType
}

/**
 * Robot settings page wrapper for shared WifiConnectionDetails organism with child navigation header
 */
export function RobotSettingsWifi({
  connectedWifiAuthType,
  setCurrentOption,
  setSelectedSsid,
  activeSsid,
}: RobotSettingsWifiProps): JSX.Element {
  const { t } = useTranslation(['device_settings'])

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <ChildNavigation
        header={t('wifi')}
        onClickBack={() => {
          setCurrentOption('NetworkSettings')
        }}
      />
      <WifiConnectionDetails
        activeSsid={activeSsid}
        connectedWifiAuthType={connectedWifiAuthType}
        handleJoinAnotherNetwork={() => {
          setCurrentOption('RobotSettingsJoinOtherNetwork')
        }}
        handleNetworkPress={(ssid: string) => {
          setSelectedSsid(ssid)
          setCurrentOption('RobotSettingsSelectAuthenticationType')
        }}
      />
    </Flex>
  )
}
