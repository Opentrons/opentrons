import { Icon, ListButton, StyledText } from '@opentrons/components'

import styles from './compliance_ready_settings.module.css'

import type { ReactNode } from 'react'

export function SettingsListButton({
  key,
  title,
  value,
  onClick,
  chevron,
}: {
  key: string
  title: string
  value?: string
  chevron?: boolean
  onClick: () => void
}): ReactNode {
  return (
    <ListButton
      key={key}
      type="noActive"
      onClick={onClick}
      className={styles.list_button}
    >
      <div className={styles.button_content}>
        <StyledText oddStyle="level4HeaderSemiBold">{title}</StyledText>
        <div className={styles.value_container}>
          <StyledText oddStyle="level4HeaderRegular" width="100%">
            {value}
          </StyledText>
          {chevron && <Icon name="chevron-right" className={styles.chevron} />}
        </div>
      </div>
    </ListButton>
  )
}
