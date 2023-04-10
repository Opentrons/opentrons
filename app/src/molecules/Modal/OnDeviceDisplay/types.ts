import type { IconName } from '@opentrons/components'

export type ModalSize = 'small' | 'medium' | 'large'

export interface ModalHeaderProps {
  title: string
  onClick?: () => void
  hasExitIcon?: boolean
  iconName?: IconName
  iconColor?: string
}
