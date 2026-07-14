import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  InputField,
  Modal,
  PrimaryButton,
  SecondaryButton,
  StyledText,
} from '@opentrons/components'

import { useHandleRobotCertImport } from '/app/organisms/Desktop/RobotCertImport/useHandleRobotCertImport'
import { useUpdateClientDataEncryptionKeys } from '/app/resources/client_data/encryptionKeys'

import styles from './robotcertimportmodal.module.css'

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
  const formId = useId()
  const isDisabled =
    handleImport.passwordValue === '' || handleImport.importInProgress
  const footer = (
    <div className={styles.modal_footer_container}>
      <SecondaryButton onClick={handleClose}>
        {t('shared:cancel')}
      </SecondaryButton>
      <PrimaryButton type="submit" form={formId} disabled={isDisabled}>
        {t('shared:submit')}
      </PrimaryButton>
    </div>
  )
  // TODO(jj): fix z-index
  return (
    <Modal
      title={t('encryption_key_modal_title')}
      closeOnOutsideClick={true}
      footer={footer}
      onClose={handleClose}
      zIndexOverlay={10000}
    >
      <form
        className={styles.robot_cert_import_container}
        id={formId}
        onSubmit={e => {
          e.preventDefault()
          if (!isDisabled) {
            handleImport.tryImport()
          }
        }}
      >
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('encryption_key_modal_body')}
        </StyledText>
        <InputField
          name="robot encryption key"
          title={t('encryption_key_modal_input_label')}
          onChange={e => {
            handleImport.setPasswordValue(e.target.value)
          }}
          error={
            handleImport.passwordError != null
              ? t('encryption_key_modal_error')
              : null
          }
          value={handleImport.passwordValue}
          autoFocus={true}
        />
      </form>
    </Modal>
  )
}
