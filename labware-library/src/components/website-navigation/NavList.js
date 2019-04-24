// @flow
import * as React from 'react'
import cx from 'classnames'
import { ClickOutside } from '@opentrons/components'

import { navLinkProps } from './nav-data'
import NavMenu from './NavMenu'
import ProtocolMenu from './ProtocolMenu'
import SupportMenu from './SupportMenu'
import styles from './styles.css'

import type { MenuName } from './types'

type State = {| menu: null | MenuName |}

type Props = {||}

export class NavList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { menu: null }
  }

  clear = () => this.setState({ menu: null })

  toggle = (name: MenuName) =>
    this.setState({ menu: this.state.menu !== name ? name : null })

  render() {
    const { menu } = this.state

    return (
      <ClickOutside onClickOutside={this.clear}>
        {({ ref }) => (
          <ul className={styles.nav_list} ref={ref}>
            {navLinkProps.map(subnav => (
              <li
                key={subnav.name}
                className={cx(styles.nav_link, {
                  [styles.active]: !menu || menu === subnav.name,
                })}
                role="button"
                onClick={() => this.toggle(subnav.name)}
              >
                <NavMenu {...subnav} active={menu === subnav.name} />
              </li>
            ))}
            <li
              className={cx(styles.nav_link, {
                [styles.active]: !menu || menu === 'Protocols',
              })}
              role="button"
              onClick={() => this.toggle('Protocols')}
            >
              <ProtocolMenu active={menu === 'Protocols'} />
            </li>
            <li
              className={cx(styles.nav_link, {
                [styles.active]: !menu || menu === 'Support',
              })}
              role="button"
              onClick={() => this.toggle('Support')}
            >
              <SupportMenu active={menu === 'Support'} />
            </li>
          </ul>
        )}
      </ClickOutside>
    )
  }
}
