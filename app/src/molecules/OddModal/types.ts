import type { IconName, StyleProps } from '@opentrons/components'
import type { MouseEventHandler } from 'react'

export type ModalSize = 'small' | 'medium' | 'large'

export interface OddModalHeaderBaseProps extends StyleProps {
  title: string | JSX.Element
  onClick?: MouseEventHandler
  hasExitIcon?: boolean
  iconName?: IconName
  iconColor?: string
  tagText?: string
}
