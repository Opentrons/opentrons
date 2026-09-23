import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { StepMeter } from '@opentrons/components'

import { ModalContentOneColSimpleButtons } from '/app/molecules/InterventionModal'

import { ChildNavigation } from '../../../ChildNavigation'
import styles from './user_management_settings.module.css'

import type { ReactNode } from 'react'

export function ChooseRole({
  onClickBack,
  onCancel,
  onSubmit,
  totalSteps,
  currentStep,
  savedRole,
  isLoading,
}: {
  onClickBack: (role?: 'admin' | 'user' | 'service') => void
  onCancel: () => void
  onSubmit: (role: 'admin' | 'user' | 'service') => Promise<void>
  totalSteps: number
  currentStep: number
  savedRole?: 'admin' | 'user' | 'service'
  isLoading: boolean
}): ReactNode {
  const [role, setRole] = useState<('admin' | 'user' | 'service') | undefined>(
    savedRole
  )
  const { t } = useTranslation('device_settings')

  const handleConfirm = useCallback(async (): Promise<void> => {
    if (role) {
      await onSubmit(role)
    }
  }, [role, onSubmit])

  return (
    <div className={styles.container}>
      <StepMeter totalSteps={totalSteps} currentStep={currentStep} />
      <ChildNavigation
        header={t('odd_choose_role_title')}
        onClickBack={() => {
          onClickBack(role)
        }}
        onClickButton={handleConfirm}
        buttonText={t('odd_create_user_continue_button')}
        buttonType="primary"
        secondaryButtonProps={{
          buttonText: t('odd_create_user_cancel_button'),
          buttonType: 'tertiaryLowLight',
          onClick: onCancel,
        }}
        buttonIsDisabled={isLoading}
        iconName={isLoading ? 'ot-spinner' : undefined}
        marginTop="12px"
      />
      <div className={styles.odd_create_user_content}>
        <div className={styles.odd_choose_role_buttons}>
          <ModalContentOneColSimpleButtons
            headline={t('odd_choose_role_headline')}
            buttons={[
              {
                label: t('odd_admin_role'),
                value: 'admin',
              },
              {
                label: t('odd_user_role'),
                value: 'user',
              },
              {
                label: t('odd_service_role'),
                value: 'service',
              },
            ]}
            onSelect={(e: React.ChangeEvent<HTMLInputElement>) => {
              setRole(e.target.value as 'admin' | 'user' | 'service')
            }}
            initialSelected={role}
          />
        </div>
      </div>
    </div>
  )
}
