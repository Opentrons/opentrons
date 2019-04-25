// @flow
import * as React from 'react'
import cx from 'classnames'
import styles from './styles.css'
import { Icon } from '@opentrons/components'
import type { ButtonProps, IconProps } from '@opentrons/components'

type State = {
  isOpen: boolean,
}

export default class MenuButton extends React.Component<ButtonProps, State> {
  constructor(props: ButtonProps) {
    super(props)
    this.state = { isOpen: false }
  }

  render() {
    const iconName = this.state.isOpen ? 'close' : 'menu'
    return (
      <ClickableIcon
        title="menu"
        name={iconName}
        className={styles.menu_button}
        onClick={() => this.setState({ isOpen: !this.state.isOpen })}
      />
    )
  }
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
