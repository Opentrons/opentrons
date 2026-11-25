import { useTranslation } from 'react-i18next'
import NiceModal from '@ebay/nice-modal-react'

import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { RobotSettingButton } from '/app/organisms/ODD/RobotSettingsDashboard'
import { useUpdateClientDataEncryptionKeys } from '/app/resources/client_data/encryptionKeys'

import styles from './robot_encryption_key_setting_option.module.css'
import { RobotEncryptionKeyModal } from './RobotEncryptionKeyModal'

import type { ReactNode } from 'react'
import type { SetSettingOption } from '../types'

interface RobotEncryptionKeySettingOptionProps {
  setCurrentOption: SetSettingOption
}

export function RobotEncryptionKeySettingOption({
  setCurrentOption,
}: RobotEncryptionKeySettingOptionProps): ReactNode {
  const { t } = useTranslation('device_settings')
  const { requestKeyDisplay } = useUpdateClientDataEncryptionKeys()
  const showPasswordModal = (): void => {
    requestKeyDisplay()
    NiceModal.show(RobotEncryptionKeyModal)
  }
  return (
    <div className={styles.setting_option_container}>
      <ChildNavigation
        header={t('robot_encryption_key')}
        onClickBack={() => {
          setCurrentOption(null)
        }}
      />
      <div className={styles.content_container}>
        <RobotSettingButton
          settingName={t('view_robot_generated_key')}
          onClick={showPasswordModal}
        />
      </div>
    </div>
  )
}
