import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

import { StyledText } from '@opentrons/components'
import { useCACertPasswordQuery } from '@opentrons/react-api-client'

import { SmallButton } from '/app/atoms/buttons'
import { ApiHostProvider } from '/app/local-resources/api-host-provider/ApiHostProvider'
import { OddModal } from '/app/molecules/OddModal'
import { RadialTimer } from '/app/molecules/RadialTimer'
import { useLocalRobotName } from '/app/redux-resources/robots/hooks/useLocalRobotName'
import { appShellInternalApiRequestor } from '/app/redux/shell/remote'
import { useUpdateClientDataEncryptionKeys } from '/app/resources/client_data/encryptionKeys'

import styles from './robot_encryption_key_modal.module.css'

const BACKUP_REFETCH_TIME_MS = 1000

export function refetchTimeForPassword(now: Date, validUntil: Date): number {
  return Math.max(validUntil.getTime() - now.getTime(), 1)
}

function RobotEncryptionKeyModalElement({
  clearClientData,
}: {
  clearClientData: () => void
}): JSX.Element {
  const { i18n, t } = useTranslation(['device_settings', 'shared', 'branded'])
  const modal = useModal()

  const close = (): void => {
    modal.remove()
    clearClientData()
  }
  const { password, valid_from_utc, valid_until_utc } = useCACertPasswordQuery({
    refetchInterval: query =>
      !!query
        ? refetchTimeForPassword(
            new Date(),
            new Date(query.data.valid_until_utc)
          )
        : BACKUP_REFETCH_TIME_MS,
  }).data?.data ?? {
    password: '',
    valid_from_utc: new Date().toISOString(),
    valid_until_utc: new Date(
      Date.now() + BACKUP_REFETCH_TIME_MS
    ).toISOString(),
  }
  const header = {
    title: t('device_settings:robot_encryption_key'),
    onClick: close,
  }

  const from = useMemo(
    () => new Date(valid_from_utc).getTime(),
    [valid_from_utc]
  )

  const until = useMemo(
    () => new Date(valid_until_utc).getTime(),
    [valid_until_utc]
  )

  const [lastPassword, setLastPassword] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      setLastPassword(password)
    }
  }, [password])

  return (
    <OddModal
      header={header}
      className={styles.modal_container}
      modalSize="small"
    >
      <div className={styles.modal_content}>
        <div className={styles.password_container}>
          <StyledText
            oddStyle="bodyTextRegular"
            className={styles.last_password}
            aria-hidden="true"
            key={lastPassword}
          >
            {lastPassword}
          </StyledText>
          <StyledText
            oddStyle="bodyTextRegular"
            className={styles.password}
            key={password}
          >
            {password}
          </StyledText>
          <RadialTimer from={from} until={until} />
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
  const robotName = useLocalRobotName()

  return (
    <ApiHostProvider
      robotName={robotName}
      requestor={appShellInternalApiRequestor}
    >
      <RobotEncryptionKeyModalElement clearClientData={clearClientData} />
    </ApiHostProvider>
  )
})
