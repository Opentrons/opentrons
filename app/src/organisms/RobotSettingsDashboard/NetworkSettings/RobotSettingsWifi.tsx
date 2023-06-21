import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { DIRECTION_COLUMN, Flex } from '@opentrons/components'

import { ChildNavigation } from '../../../organisms/ChildNavigation'
import { WifiConnectionDetails } from './WifiConnectionDetails'

import type { WifiSecurityType } from '@opentrons/api-client'
import type { SetSettingOption } from '../../../pages/OnDeviceDisplay/RobotSettingsDashboard'

interface RobotSettingsWifiProps {
  setSelectedSsid: React.Dispatch<React.SetStateAction<string>>
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
        onClickBack={() => setCurrentOption('NetworkSettings')}
      />
      <WifiConnectionDetails
        activeSsid={activeSsid}
        connectedWifiAuthType={connectedWifiAuthType}
        handleJoinAnotherNetwork={() =>
          setCurrentOption('RobotSettingsJoinOtherNetwork')
        }
        handleNetworkPress={(ssid: string) => {
          setSelectedSsid(ssid)
          setCurrentOption('RobotSettingsSelectAuthenticationType')
        }}
      />
    </Flex>
  )
}
