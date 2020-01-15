// @flow
import * as React from 'react'
import cx from 'classnames'

import { Icon } from '@opentrons/components'
import styles from './styles.css'
import type { IconName } from '@opentrons/components'

export type ClickableIconProps = {|
  name: IconName,
  className?: string,
  title?: string,
  onClick?: (SyntheticMouseEvent<>) => mixed,
|}

export function ClickableIcon(props: ClickableIconProps) {
  const { name, className, ...buttonProps } = props
  const buttonCx = cx(styles.clickable_icon, className)

  return (
    <button type="button" className={buttonCx} {...buttonProps}>
      <Icon name={name} />
    </button>
  )
}
