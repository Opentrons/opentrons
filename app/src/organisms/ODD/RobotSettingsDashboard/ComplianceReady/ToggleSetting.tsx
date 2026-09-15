import { SettingsListButton } from './SettingsListButton'

import type { ReactNode } from 'react'

export function ToggleSetting({
  onClick,
  title,
  value,
}: {
  onClick: () => void
  title: string
  value: boolean
}): ReactNode {
  return (
    <SettingsListButton
      key={title}
      title={title}
      value={value ? 'On' : 'Off'}
      onClick={onClick}
    />
  )
}
