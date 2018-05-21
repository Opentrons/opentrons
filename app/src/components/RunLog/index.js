import React from 'react'
import {connect} from 'react-redux'

import {selectors as robotSelectors} from '../../robot'

import CommandList from './CommandList'

const mapStateToProps = (state) => ({
  commands: robotSelectors.getCommands(state)
})

function ConnectedRunLog (props) {
  return (
    <CommandList {...props} />
  )
}

export default connect(mapStateToProps)(ConnectedRunLog)
