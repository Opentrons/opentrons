import type { IconName } from '@opentrons/components'

export type ModalSize = 'small' | 'medium' | 'large'

export interface ModalHeaderBaseProps {
  title: string
  onClick?: React.MouseEventHandler
  hasExitIcon?: boolean
  iconName?: IconName
  iconColor?: string
}
