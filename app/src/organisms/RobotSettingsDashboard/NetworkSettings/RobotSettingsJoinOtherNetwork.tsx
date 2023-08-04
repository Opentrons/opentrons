import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { DIRECTION_COLUMN, Flex } from '@opentrons/components'

import { ChildNavigation } from '../../../organisms/ChildNavigation'
import { SetWifiSsid } from '../../../organisms/NetworkSettings/SetWifiSsid'

import type { SetSettingOption } from '../../../pages/OnDeviceDisplay/RobotSettingsDashboard'

interface RobotSettingsJoinOtherNetworkProps {
  setCurrentOption: SetSettingOption
  setSelectedSsid: React.Dispatch<React.SetStateAction<string>>
}

/**
 * Robot settings page wrapper for shared SetWifiSsid organism with child navigation header
 */
export function RobotSettingsJoinOtherNetwork({
  setCurrentOption,
  setSelectedSsid,
}: RobotSettingsJoinOtherNetworkProps): JSX.Element {
  const { i18n, t } = useTranslation('device_settings')

  const [inputSsid, setInputSsid] = React.useState<string>('')
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const handleContinue = (): void => {
    if (inputSsid.length >= 2 && inputSsid.length <= 32) {
      setSelectedSsid(inputSsid)
      setCurrentOption('RobotSettingsSelectAuthenticationType')
    } else {
      setErrorMessage(t('join_other_network_error_message'))
    }
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <ChildNavigation
        buttonText={i18n.format(t('continue'), 'capitalize')}
        header={t('join_other_network')}
        onClickBack={() => setCurrentOption('RobotSettingsWifi')}
        onClickButton={handleContinue}
      />
      <SetWifiSsid
        errorMessage={errorMessage}
        inputSsid={inputSsid}
        setInputSsid={setInputSsid}
      />
    </Flex>
  )
}
