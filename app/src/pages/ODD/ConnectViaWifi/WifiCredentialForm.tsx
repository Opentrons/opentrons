import { useTranslation } from 'react-i18next'

import { WifiPasswordInput } from '/app/organisms/ODD/NetworkSettings'
import { RobotSetupHeader } from '/app/organisms/ODD/RobotSetupHeader'

import styles from './wificredentialform.module.css'

import type { Dispatch, SetStateAction } from 'react'
import type { WifiScreenOption } from './'

interface WifiCredentialFormProps {
  handleConnect: () => void
  password: string
  setCurrentOption: (option: WifiScreenOption) => void
  setPassword: Dispatch<SetStateAction<string>>
}

export function WifiCredentialForm({
  handleConnect,
  password,
  setCurrentOption,
  setPassword,
}: WifiCredentialFormProps): JSX.Element {
  const { t } = useTranslation('device_settings')

  return (
    <div className={styles.form_container}>
      <RobotSetupHeader
        buttonText={t('connect')}
        header={t('sign_into_wifi')}
        onClickBack={() => {
          setCurrentOption('SelectAuthType')
        }}
        onClickButton={handleConnect}
      />
      <WifiPasswordInput password={password} setPassword={setPassword} />
    </div>
  )
}
