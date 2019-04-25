// @flow
import * as React from 'react'
import cx from 'classnames'
import styles from './styles.css'
import { Icon } from '@opentrons/components'
import type { IconProps } from '@opentrons/components'
import type { MobileNavProps } from './types'

export default function MenuButton(props: MobileNavProps) {
  const iconName = props.isMobileOpen ? 'close' : 'menu'
  return (
    <ClickableIcon
      title="menu"
      name={iconName}
      className={styles.menu_button}
      onClick={props.onMobileClick}
    />
  )
}

// ONEOFF: Needed for overriding button styles, possible candidate for ui/
type Props = { ...React.ElementProps<'button'>, ...$Exact<IconProps> }

export function ClickableIcon(props: Props) {
  const className = cx(styles.clickable_icon, props.className)
  return (
    <button type="button" {...props} className={className}>
      <Icon name={props.name} />
    </button>
  )
}
