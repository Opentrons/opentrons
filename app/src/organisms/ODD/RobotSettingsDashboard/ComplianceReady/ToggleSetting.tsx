import { SettingsListButton } from './SettingsListButton'

import type { ReactNode } from 'react'

export function ToggleSetting({
  onClick,
  title,
  value,
  detail,
}: {
  onClick: () => void
  title: string
  value: boolean
  detail?: string
}): ReactNode {
  return (
    <SettingsListButton
      key={title}
      title={title}
      detail={detail}
      value={value ? 'On' : 'Off'}
      onClick={onClick}
      toggleValue
    />
  )
}
