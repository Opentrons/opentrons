import { useTranslation } from 'react-i18next'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

import { StyledText } from '@opentrons/components'
import {
  ApiHostProvider,
  useCACertPasswordQuery,
} from '@opentrons/react-api-client'

import { SmallButton } from '/app/atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { RobotSettingButton } from '/app/organisms/ODD/RobotSettingsDashboard'
import { appShellInternalApiRequestor } from '/app/redux/shell/remote'

import styles from './robot_encryption_key.module.css'

import type { SetSettingOption } from '../types'

interface RobotEncryptionKeyProps {
  setCurrentOption: SetSettingOption
}

const BACKUP_REFETCH_TIME_MS = 1000

export function RobotEncryptionKey({
  setCurrentOption,
}: RobotEncryptionKeyProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const showPasswordModal = (): void => {
    NiceModal.show(ViewPasswordModal)
  }
  return (
    <div className={styles.robot_encryption_key_container}>
      <ChildNavigation
        header={t('robot_encryption_key')}
        onClickBack={() => {
          setCurrentOption(null)
        }}
      />
      <div className={styles.robot_encryption_key_content_container}>
        <RobotSettingButton
          settingName={t('view_robot_generated_key')}
          onClick={showPasswordModal}
        />
      </div>
    </div>
  )
}

export function refetchTimeForPassword(
  now: Date,
  validUntil: Date
): number | false {
  return Math.max(validUntil.getTime() - now.getTime(), 1)
}

function ViewPasswordModalElement(): JSX.Element {
  const { i18n, t } = useTranslation(['device_settings', 'shared', 'branded'])
  const modal = useModal()
  const { password } = useCACertPasswordQuery({
    refetchInterval: query =>
      !!query
        ? refetchTimeForPassword(
            new Date(),
            new Date(query.data.valid_until_utc)
          )
        : BACKUP_REFETCH_TIME_MS,
  }).data?.data ?? { password: '' }
  const header = {
    title: t('device_settings:robot_encryption_key'),
    onClick: modal.remove,
  }
  return (
    <OddModal
      header={header}
      className={styles.robot_encryption_key_modal_container}
      modalSize="small"
    >
      <div className={styles.robot_encryption_key_modal_content}>
        <div className={styles.robot_encryption_key_password_container}>
          <StyledText oddStyle="bodyTextRegular">{password}</StyledText>
        </div>
        <StyledText oddStyle="bodyTextRegular">
          {t('branded:enter_this_key_into_the_app')}
        </StyledText>
      </div>
      <SmallButton
        flex="1"
        buttonText={i18n.format(t('shared:ok'), 'capitalize')}
        onClick={modal.remove}
      />
    </OddModal>
  )
}

const ViewPasswordModal = NiceModal.create(
  (): JSX.Element => (
    <ApiHostProvider
      hostname="127.0.0.1"
      requestor={appShellInternalApiRequestor}
    >
      <ViewPasswordModalElement />
    </ApiHostProvider>
  )
)
