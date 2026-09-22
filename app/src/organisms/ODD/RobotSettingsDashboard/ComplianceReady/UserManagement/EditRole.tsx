import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ModalContentOneColSimpleButtons } from '/app/molecules/InterventionModal'

import { ChildNavigation } from '../../../ChildNavigation'
import styles from './user_management_settings.module.css'

import type { ReactNode } from 'react'

export function EditRole({
  onCancel,
  onSubmit,
  isLoading,
  savedRole,
}: {
  onCancel: () => void
  onSubmit: (role: 'admin' | 'user' | 'auditor') => void
  isLoading?: boolean
  savedRole?: 'user' | 'admin' | 'auditor'
}): ReactNode {
  const [role, setRole] = useState<('user' | 'admin' | 'auditor') | undefined>(
    savedRole
  )
  const { t } = useTranslation('device_settings')

  const handleConfirm = useCallback((): void => {
    if (role) {
      onSubmit(role)
    }
  }, [role, onSubmit])

  return (
    <div className={styles.container}>
      <ChildNavigation
        header={t('odd_edit_role_title')}
        onClickBack={onCancel}
        onClickButton={handleConfirm}
        buttonText={t('odd_save_role_button')}
        buttonType="primary"
        secondaryButtonProps={{
          buttonText: t('odd_create_user_cancel_button'),
          buttonType: 'tertiaryLowLight',
          onClick: onCancel,
        }}
        iconName={isLoading ? 'ot-spinner' : undefined}
        buttonIsDisabled={isLoading}
      />
      <div className={styles.odd_create_user_content}>
        <div className={styles.odd_choose_role_buttons}>
          <ModalContentOneColSimpleButtons
            headline={t('odd_choose_role_headline')}
            buttons={[
              {
                label: t('odd_user_role'),
                value: 'user',
              },
              {
                label: t('odd_admin_role'),
                value: 'admin',
              },
              {
                label: t('odd_auditor_role'),
                value: 'auditor',
              },
            ]}
            onSelect={(e: React.ChangeEvent<HTMLInputElement>) => {
              setRole(e.target.value as 'admin' | 'user' | 'auditor')
            }}
            initialSelected={role}
          />
        </div>
      </div>
    </div>
  )
}
