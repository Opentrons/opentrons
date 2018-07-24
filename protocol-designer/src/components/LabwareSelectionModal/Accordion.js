// @flow
import * as React from 'react'

type Props = {
  title: string,
  collapsed?: boolean,
  children?: React.Node
}

type State = {
  collapsed: boolean
}

class Accordion extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {collapsed: true}
  }
  render () {
    const { children, title } = this.props
    const { collapsed } = this.state
    return (
      <li onClick={() => this.setState({collapsed: !collapsed})}>
        <label>{title} {collapsed ? '►' : '▼'}</label>
        {!collapsed && <ul>
          {children}
        </ul>}
      </li>
    )
  }
}

export default Accordion
