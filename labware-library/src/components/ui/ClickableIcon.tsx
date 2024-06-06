import * as React from 'react'
import cx from 'classnames'
import { Icon } from '@opentrons/components'
import styles from './styles.module.css'
import type { IconName } from '@opentrons/components'

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
