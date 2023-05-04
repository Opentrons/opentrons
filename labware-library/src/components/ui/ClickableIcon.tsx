import styles from './styles.css'
import { Icon } from '@opentrons/components'
import type { IconName } from '@opentrons/components'
import cx from 'classnames'
import * as React from 'react'

export interface ClickableIconProps {
  name: IconName
  className?: string
  title?: string
  onClick?: (e: React.MouseEvent) => unknown
}

export function ClickableIcon(props: ClickableIconProps): JSX.Element {
  const { name, className, ...buttonProps } = props
  const buttonCx = cx(styles.clickable_icon, className)

  return (
    <button type="button" className={buttonCx} {...buttonProps}>
      <Icon name={name} />
    </button>
  )
}
