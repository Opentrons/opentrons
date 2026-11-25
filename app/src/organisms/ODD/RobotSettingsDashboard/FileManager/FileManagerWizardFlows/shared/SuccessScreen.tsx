import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

import SuccessIcon from '/app/assets/images/icon_success.png'
import { SmallButton } from '/app/atoms/buttons'

import styles from './shared.module.css'

import type { ReactNode } from 'react'

interface SuccessScreenProps {
  message: string
  onFinish: () => void
}

export function SuccessScreen({
  message,
  onFinish,
}: SuccessScreenProps): ReactNode {
  const { t, i18n } = useTranslation('shared')

  return (
    <>
      <div className={styles.centered_content}>
        <img
          src={SuccessIcon}
          width="250"
          height="208"
          alt=""
          aria-hidden="true"
        />
        <StyledText oddStyle="level3HeaderBold" className={styles.status_text}>
          {message}
        </StyledText>
      </div>
      <div className={styles.buttons}>
        <SmallButton
          buttonText={i18n.format(t('finish'), 'capitalize')}
          onClick={onFinish}
        />
      </div>
    </>
  )
}
