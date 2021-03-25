import * as React from 'react'
import { MenuButton } from './MenuButton'
import { MobileList } from './MobileList'

interface State {
  isOpen: boolean
}

export class MobileNav extends React.Component<{}, State> {
  constructor(props: {}) {
    super(props)
    this.state = { isOpen: false }
  }

  toggle: () => void = () => {
    this.setState({ isOpen: !this.state.isOpen })
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/prefer-optional-chain
    document.body && document.body.classList.toggle('no_scroll')
  }

  componentWillUnmount(): void {
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/prefer-optional-chain
    document.body && document.body.classList.remove('no_scroll')
  }

  render(): JSX.Element {
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
