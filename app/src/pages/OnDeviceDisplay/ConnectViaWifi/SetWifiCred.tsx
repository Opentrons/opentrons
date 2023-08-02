import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { Flex, DIRECTION_COLUMN } from '@opentrons/components'

import { SetWifiCred as SetWifiCredComponent } from '../../../organisms/NetworkSettings'
import { RobotSetupHeader } from '../../../organisms/RobotSetupHeader'

import type { WifiScreenOption } from '.'

interface SetWifiCredProps {
  handleConnect: () => void
  password: string
  setCurrentOption: (option: WifiScreenOption) => void
  setPassword: React.Dispatch<React.SetStateAction<string>>
}

export function SetWifiCred({
  handleConnect,
  password,
  setCurrentOption,
  setPassword,
}: SetWifiCredProps): JSX.Element {
  const { t } = useTranslation('device_settings')

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <RobotSetupHeader
        buttonText={t('connect')}
        header={t('sign_into_wifi')}
        onClickBack={() => setCurrentOption('SelectAuthType')}
        onClickButton={handleConnect}
      />
      <SetWifiCredComponent password={password} setPassword={setPassword} />
    </Flex>
  )
}
