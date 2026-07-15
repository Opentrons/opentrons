import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  InputField,
  Modal,
  PrimaryButton,
  SecondaryButton,
  StyledText,
} from '@opentrons/components'

import { useUpdateClientDataEncryptionKeys } from '/app/resources/client_data/encryptionKeys'

import styles from './robot_cert_import.module.css'
import { useHandleRobotCertImport } from './useHandleRobotCertImport'

export interface RobotCertImportModalProps {
  onClose: () => unknown
}

export function RobotCertImportModal(
  props: RobotCertImportModalProps
): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const { requestKeyDisplay, clearKeyDisplay } =
    useUpdateClientDataEncryptionKeys()
  const [requestKey, setRequestKey] = useState<string | null>(null)
  useEffect(
    (): void => {
      setRequestKey(requestKeyDisplay())
    },
    // this hook should run on mount only, and requestKey is not read in its callback
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )
  const handleClose = (): void => {
    requestKey != null && clearKeyDisplay(requestKey)
    props.onClose()
  }
  const handleImport = useHandleRobotCertImport({
    onSuccessfulImport: handleClose,
  })
  const footer = (
    <div className={styles.modal_footer_container}>
      <SecondaryButton onClick={handleClose}>
        {t('shared:cancel')}
      </SecondaryButton>
      <PrimaryButton
        onClick={handleImport.tryImport}
        disabled={
          handleImport.passwordValue === '' || handleImport.importInProgress
        }
      >
        {t('shared:submit')}
      </PrimaryButton>
    </div>
  )
  // TODO(jj): fix z-index
  return (
    <Modal
      title={t('enter_robot_encryption_key')}
      closeOnOutsideClick={true}
      footer={footer}
      onClose={handleClose}
      zIndexOverlay={10000}
    >
      <div className={styles.robot_cert_import_container}>
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('verify_the_robot_encryption_key_to_use_the_robot')}
        </StyledText>
        <InputField
          name="robot encryption key"
          title={t('robot_encryption_key')}
          onChange={e => {
            handleImport.setPasswordValue(e.target.value)
          }}
          error={
            handleImport.passwordError != null
              ? t('invalid_encryption_key_try_again')
              : null
          }
          value={handleImport.passwordValue}
          autoFocus={true}
        />
      </div>
    </Modal>
  )
}
