// @flow
import * as React from 'react'
import NavDropdown from './NavDropdown'
import styles from './styles.css'

import { navLinkProps } from './nav-data'

type State = {
  about: boolean,
  products: boolean,
  applications: boolean,
  protocols: boolean,
  support: boolean,
}

type Props = {}
export default class NavList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      about: false,
      products: false,
      applications: false,
      protocols: false,
      support: false,
    }
  }

  toggle = (name: string) => {
    return () => this.setState({ [name]: !this.state[name] })
  }

  render() {
    return (
      <ul className={styles.nav_list}>
        {navLinkProps.map(subnav => (
          <NavDropdown
            {...subnav}
            key={subnav.name}
            active={this.state[subnav.name]}
            onClick={this.toggle(subnav.name)}
          />
        ))}
        <li className={styles.nav_link}>Protocols</li>
        <li className={styles.nav_link}>Support & Sales</li>
      </ul>
    )
  }
}
