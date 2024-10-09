import { Component } from 'react'
import { MenuButton } from './MenuButton'
import { MobileList } from './MobileList'

interface State {
  isOpen: boolean
}

type Props = Record<string, never>

export class MobileNav extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { isOpen: false }
  }

  toggle: () => void = () => {
    this.setState({ isOpen: !this.state.isOpen })
    document.body && document.body.classList.toggle('no_scroll')
  }

  componentWillUnmount(): void {
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
