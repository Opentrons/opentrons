import { useTranslation } from 'react-i18next'

import { StepMeter, StyledText } from '@opentrons/components'

import { ChildNavigation } from '../../../ChildNavigation'
import styles from './user_management_settings.module.css'

import type { ReactNode } from 'react'

export function ShareOneTimePassword({
  onConfirm,
  totalSteps,
  currentStep,
  oneTimePassword,
}: {
  onConfirm: () => void
  totalSteps: number
  currentStep: number
  oneTimePassword: string
}): ReactNode {
  const { t } = useTranslation('device_settings')

  return (
    <div className={styles.container}>
      <StepMeter totalSteps={totalSteps} currentStep={currentStep} />
      <ChildNavigation
        header={t('odd_share_one_time_password_title')}
        onClickButton={onConfirm}
        buttonText={t('odd_create_user_confirm_button')}
        buttonType="primary"
        marginTop="12px"
      />
      <div className={styles.share_one_time_password_content}>
        <div className={styles.share_one_time_password_left}>
          <StyledText oddStyle="level4HeaderSemiBold">
            {t('odd_share_one_time_password_header')}
          </StyledText>
          <StyledText oddStyle="bodyTextRegular">
            {t('odd_share_one_time_password_description')}
          </StyledText>
        </div>
        <div className={styles.share_one_time_password_right}>
          <StyledText oddStyle="smallBodyTextSemiBold">
            {t('odd_share_one_time_password_caption')}
          </StyledText>
          <div className={styles.share_one_time_password_password}>
            <StyledText
              oddStyle="smallBodyTextRegular"
              className={styles.share_one_time_password_password_text}
            >
              {oneTimePassword}
            </StyledText>
          </div>
        </div>
      </div>
    </div>
  )
}
