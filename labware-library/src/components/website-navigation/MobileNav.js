// @flow
import * as React from 'react'
import { MenuButton } from './MenuButton'
import { MobileList } from './MobileList'

type State = {|
  isOpen: boolean,
|}

type Props = {||}

export class MobileNav extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { isOpen: false }
  }

  toggle = () => {
    this.setState({ isOpen: !this.state.isOpen })
    document.body && document.body.classList.toggle('no_scroll')
  }

  componentWillUnmount() {
    document.body && document.body.classList.remove('no_scroll')
  }

  render() {
    return (
      <>
        <MenuButton
          onMobileClick={this.toggle}
          isMobileOpen={this.state.isOpen}
        />
        {this.state.isOpen && <MobileList />}
      </>
    )
  }
}
