import clsx from 'clsx'

import { COLORS, Icon, ListButton, StyledText } from '@opentrons/components'

import styles from './compliance_ready_settings.module.css'

import type { ReactNode } from 'react'

export function SettingsListButton({
  key,
  title,
  detail,
  value,
  onClick,
  chevron,
  toggleValue,
}: {
  key: string
  title: string
  detail?: string
  value?: string
  chevron?: boolean
  onClick: () => void
  toggleValue?: boolean
}): ReactNode {
  return (
    <ListButton
      key={key}
      type="noActive"
      onClick={onClick}
      className={styles.list_button}
    >
      <div className={styles.button_content}>
        <div className={styles.title_container}>
          <StyledText oddStyle="level4HeaderSemiBold">{title}</StyledText>
          {detail && (
            <StyledText oddStyle="level4HeaderRegular" color={COLORS.grey60}>
              {detail}
            </StyledText>
          )}
        </div>
        <div
          className={clsx(
            styles.value_container,
            toggleValue && styles.toggle_value_container
          )}
        >
          <StyledText oddStyle="level4HeaderRegular" width="100%">
            {value}
          </StyledText>
          {chevron && <Icon name="chevron-right" className={styles.chevron} />}
        </div>
      </div>
    </ListButton>
  )
}
