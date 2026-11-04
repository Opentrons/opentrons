import { useTranslation } from 'react-i18next'

import { SelectAuthenticationType } from '/app/organisms/ODD/NetworkSettings'
import { RobotSetupHeader } from '/app/organisms/ODD/RobotSetupHeader'

import styles from './wifiauthenticationselector.module.css'

import type { ReactNode } from 'react'
import type { WifiSecurityType } from '@opentrons/api-client'
import type { WifiScreenOption } from './'

interface WifiAuthenticationSelectorProps {
  handleWifiConnect: () => void
  selectedAuthType: WifiSecurityType
  setCurrentOption: (option: WifiScreenOption) => void
  setSelectedAuthType: (authType: WifiSecurityType) => void
}

export function WifiAuthenticationSelector({
  handleWifiConnect,
  selectedAuthType,
  setCurrentOption,
  setSelectedAuthType,
}: WifiAuthenticationSelectorProps): ReactNode {
  const { i18n, t } = useTranslation(['device_settings', 'shared'])

  return (
    <div className={styles.authentication_selector_container}>
      <RobotSetupHeader
        buttonText={i18n.format(t('shared:continue'), 'capitalize')}
        header={t('select_a_security_type')}
        onClickBack={() => {
          setCurrentOption('WifiList')
        }}
        onClickButton={() => {
          selectedAuthType !== 'none'
            ? setCurrentOption('SetWifiCred')
            : handleWifiConnect()
        }}
      />
      <SelectAuthenticationType
        selectedAuthType={selectedAuthType}
        setSelectedAuthType={setSelectedAuthType}
      />
    </div>
  )
}
