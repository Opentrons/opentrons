// @flow
import { ClickOutside } from '@opentrons/components'
import cx from 'classnames'
import * as React from 'react'

import { aboutLinkProps, applicationLinkProps } from './nav-data'
import { NavMenu } from './NavMenu'
import { ProductMenu } from './ProductMenu'
import { ProtocolMenu } from './ProtocolMenu'
import styles from './styles.css'
import { SupportMenu } from './SupportMenu'
import type { MenuName } from './types'

type State = {| menu: null | MenuName |}

type Props = {||}

export class NavList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { menu: null }
  }

  clear: () => void = () => this.setState({ menu: null })

  toggle: (name: MenuName) => void = name =>
    this.setState({ menu: this.state.menu !== name ? name : null })

  render(): React.Node {
    const { menu } = this.state

    return (
      <ClickOutside onClickOutside={this.clear}>
        {({ ref }) => (
          <ul className={styles.nav_list} ref={ref}>
            <li
              className={cx(styles.nav_link, {
                [styles.active]: !menu || menu === 'About',
              })}
              role="button"
              onClick={() => this.toggle('About')}
            >
              <NavMenu {...aboutLinkProps} active={menu === 'About'} />
            </li>

            <li
              className={cx(styles.nav_link, {
                [styles.active]: !menu || menu === 'Products',
              })}
              role="button"
              onClick={() => this.toggle('Products')}
            >
              <ProductMenu active={menu === 'Products'} />
            </li>

            <li
              className={cx(styles.nav_link, {
                [styles.active]: !menu || menu === 'Applications',
              })}
              role="button"
              onClick={() => this.toggle('Applications')}
            >
              <NavMenu
                {...applicationLinkProps}
                active={menu === 'Applications'}
              />
            </li>

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
