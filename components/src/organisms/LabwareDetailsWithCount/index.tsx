import { useTranslation } from 'react-i18next'

import { StyledText, Tag } from '../../atoms'
import styles from './LabwareDetailsWithCount.module.css'

import type { ReactNode } from 'react'

interface LabwareDetailsWithCountProps {
  title: string
  subTitle?: string
  quantity?: number
}

export function LabwareDetailsWithCount({
  title,
  subTitle,
  quantity: label,
}: LabwareDetailsWithCountProps): ReactNode {
  const { t } = useTranslation('protocol_command_text')
  return (
    <div className={styles.container}>
      <StyledText desktopStyle="bodyDefaultRegular">{title}</StyledText>
      <div className={styles.subTitle}>
        <StyledText desktopStyle="bodyDefaultRegular">{subTitle}</StyledText>
      </div>
      {label != null ? (
        <div className={styles.label}>
          <Tag type="default" text={t('quantity', { count: label })} />
        </div>
      ) : null}
    </div>
  )
}
