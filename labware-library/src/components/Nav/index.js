// @flow
// top nav bar component
import * as React from 'react'
import { SubdomainNav, MainNav, MobileNav } from '../website-navigation'
import styles from './styles.css'

export { default as Breadcrumbs } from './Breadcrumbs'

type State = {
  isOpen: boolean,
}

type Props = {||}

export default class Nav extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { isOpen: false }
  }

  toggle = () => {
    this.setState({ isOpen: !this.state.isOpen })
    document.body && document.body.classList.toggle('no_scroll')
  }

  render() {
    return (
      <>
        <nav className={styles.nav}>
          <div className={styles.subdomain_nav_wrapper}>
            <div className={styles.nav_container}>
              <SubdomainNav />
            </div>
          </div>
          <div className={styles.main_nav_wrapper}>
            <div className={styles.nav_container}>
              <MainNav
                onMobileClick={() => this.toggle()}
                isMobileOpen={this.state.isOpen}
              />
            </div>
          </div>
        </nav>
        {this.state.isOpen && <MobileNav />}
      </>
    )
  }
}
