import { useTranslation } from 'react-i18next'

import {
  InputField,
  Modal,
  PrimaryButton,
  StyledText,
} from '@opentrons/components'

import styles from './robot_cert_import.module.css'
import { useHandleRobotCertImport } from './useHandleRobotCertImport'

export interface RobotCertImportModalProps {
  onClose: () => unknown
}

export function RobotCertImportModal(
  props: RobotCertImportModalProps
): JSX.Element {
  const { t } = useTranslation(['device_settings'])
  const handleImport = useHandleRobotCertImport({
    onSuccessfulImport: props.onClose,
  })
  const footer = (
    <div className={styles.modal_footer_container}>
      <PrimaryButton onClick={handleImport.tryImport}>
        <StyledText>{t('verify')}</StyledText>
      </PrimaryButton>
    </div>
  )
  return (
    <Modal
      title={t('robot_encryption_key_verification')}
      closeOnOutsideClick={true}
      footer={footer}
      onClose={props.onClose}
    >
      <div className={styles.robot_cert_import_container}>
        <div>
          <StyledText desktopStyle="headingSmallBold">
            {t('verify_robot_encryption_key')}
          </StyledText>

          <StyledText desktopStyle="bodyDefaultRegular">
            {t('verify_the_robot_encryption_key_to_use_the_robot')}
          </StyledText>
        </div>
        <div>
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
      </div>
    </Modal>
  )
}
