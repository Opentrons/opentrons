import React from 'react'

class Accordion extends React.Component {
  constructor (props) {
    super(props)
    this.state = {collapsed: true}
  }
  render () {
    const { children, title } = this.props
    const { collapsed } = this.state
    return (
      <li onClick={e => this.setState({collapsed: !collapsed})}>
        <label>{title} {collapsed ? '►' : '▼'}</label>
        {!collapsed && <ul>
          {children}
        </ul>}
      </li>
    )
  }
}

export default Accordion
