// @flow
import * as React from 'react'
import styles from './styles.css'
import { MobileMenu } from './MobileMenu'
import { MobileContent } from './MobileContent'
import { ProductMobileContent } from './ProductMobileContent'
import { ProtocolMobileContent } from './ProtocolMobileContent'
import { SupportMobileContent } from './SupportMobileContent'

import { aboutLinkProps, applicationLinkProps } from './nav-data'

import type { MenuName } from './types'

type State = {| menu: null | MenuName |}

type Props = {||}

export class MobileList extends React.Component<Props, State> {
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
      <ul className={styles.mobile_nav}>
        <li className={styles.mobile_nav_item} role="button">
          <MobileMenu
            name="About"
            active={menu === 'About'}
            onClick={() => this.toggle('About')}
          >
            <MobileContent {...aboutLinkProps} />
          </MobileMenu>
        </li>

        <li className={styles.mobile_nav_item} role="button">
          <MobileMenu
            name="Products"
            active={menu === 'Products'}
            onClick={() => this.toggle('Products')}
          >
            <ProductMobileContent />
          </MobileMenu>
        </li>

        <li className={styles.mobile_nav_item} role="button">
          <MobileMenu
            name="Applications"
            active={menu === 'Applications'}
            onClick={() => this.toggle('Applications')}
          >
            <MobileContent {...applicationLinkProps} />
          </MobileMenu>
        </li>

        <li className={styles.mobile_nav_item} role="button">
          <MobileMenu
            name="Protocols"
            active={menu === 'Protocols'}
            onClick={() => this.toggle('Protocols')}
          >
            <ProtocolMobileContent />
          </MobileMenu>
        </li>
        <li className={styles.mobile_nav_item} role="button">
          <MobileMenu
            name="Support & Sales"
            active={menu === 'Support'}
            onClick={() => this.toggle('Support')}
          >
            <SupportMobileContent />
          </MobileMenu>
        </li>
      </ul>
    )
  }
}
