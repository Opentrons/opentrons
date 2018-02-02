// A development tool for debugging selectors & Redux state
import * as React from 'react'
import { connect } from 'react-redux'
import mapValues from 'lodash/mapValues'

import {selectors} from '../steplist/reducers' // TODO Ian 2018-01-26 add in other modules

class SelectorDebugger extends React.Component {
  constructor (props) {
    super(props)
    this.state = {collapsed: true}
    this.toggleCollapsed = this.toggleCollapsed.bind(this)
  }

  toggleCollapsed () {
    this.setState({...this.state, collapsed: !this.state.collapsed})
  }

  render () {
    const collapsedDims = {
      width: '20px',
      height: '20px'
    }
    const baseStyle = {
      position: 'absolute',
      padding: '1rem',
      right: 0,
      bottom: 0,
      zIndex: '999999990',
      backgroundColor: '#3f3f3f',
      color: '#d9d9d9',
      fontSize: '1.25rem'
    }

    return (
      <div style={this.state.collapsed ? {...baseStyle, ...collapsedDims} : baseStyle}>
        <div
          style={{...baseStyle, ...collapsedDims, backgroundColor: 'yellow', zIndex: '999999999'}}
          onClick={this.toggleCollapsed}
        />

        {!this.state.collapsed && <textarea
          style={{...baseStyle, width: '40vw', height: '30vh'}}
          readOnly
          value={JSON.stringify(this.props.selectors, null, 2)}
        />}
      </div>
    )
  }
}

function mapStateToProps (state) {
  return {selectors: mapValues(selectors, selector => selector(state))}
}

export default connect(mapStateToProps)(SelectorDebugger)
