import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { Flex, DIRECTION_COLUMN } from '@opentrons/components'

import { SetWifiSsid } from '../../../organisms/NetworkSettings'
import { RobotSetupHeader } from '../../../organisms/RobotSetupHeader'

import type { WifiScreenOption } from '.'

interface JoinOtherNetworkProps {
  setCurrentOption: (option: WifiScreenOption) => void
  setSelectedSsid: React.Dispatch<React.SetStateAction<string>>
}

export function JoinOtherNetwork({
  setCurrentOption,
  setSelectedSsid,
}: JoinOtherNetworkProps): JSX.Element {
  const { i18n, t } = useTranslation('device_settings')

  const [inputSsid, setInputSsid] = React.useState<string>('')
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const handleContinue = (): void => {
    if (inputSsid.length >= 2 && inputSsid.length <= 32) {
      setSelectedSsid(inputSsid)
      setCurrentOption('SelectAuthType')
    } else {
      setErrorMessage(t('join_other_network_error_message'))
    }
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <RobotSetupHeader
        buttonText={i18n.format(t('continue'), 'capitalize')}
        header={t('join_other_network')}
        onClickBack={() => setCurrentOption('WifiList')}
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
