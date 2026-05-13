import { useTranslation } from 'react-i18next'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

import { StyledText } from '@opentrons/components'
import {
  ApiHostProvider,
  useCACertPasswordQuery,
} from '@opentrons/react-api-client'

import { SmallButton } from '/app/atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'
import { appShellInternalApiRequestor } from '/app/redux/shell/remote'
import { useUpdateClientDataEncryptionKeys } from '/app/resources/client_data/encryptionKeys'

import styles from './robot_encryption_key_modal.module.css'

const BACKUP_REFETCH_TIME_MS = 1000

export function refetchTimeForPassword(
  now: Date,
  validUntil: Date
): number | false {
  return Math.max(validUntil.getTime() - now.getTime(), 1)
}

interface REKMEProps {
  clearClientData: () => void
}

function RobotEncryptionKeyModalElement({
  clearClientData,
}: REKMEProps): JSX.Element {
  const { i18n, t } = useTranslation(['device_settings', 'shared', 'branded'])
  const modal = useModal()

  const close = (): void => {
    modal.remove()
    clearClientData()
  }
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
    onClick: close,
  }

  return (
    <OddModal
      header={header}
      className={styles.modal_container}
      modalSize="small"
    >
      <div className={styles.modal_content}>
        <div className={styles.password_container}>
          <StyledText oddStyle="bodyTextRegular">{password}</StyledText>
        </div>
        <StyledText oddStyle="bodyTextRegular">
          {t('branded:enter_this_key_into_the_app')}
        </StyledText>
      </div>
      <SmallButton
        flex="1"
        buttonText={i18n.format(t('shared:ok'), 'capitalize')}
        onClick={close}
      />
    </OddModal>
  )
}

export const RobotEncryptionKeyModal = NiceModal.create((): JSX.Element => {
  const { clearClientData } = useUpdateClientDataEncryptionKeys()
  return (
    <ApiHostProvider
      hostname={_ODD_IP_ ?? 'localhost'}
      requestor={appShellInternalApiRequestor}
    >
      <RobotEncryptionKeyModalElement clearClientData={clearClientData} />
    </ApiHostProvider>
  )
})
