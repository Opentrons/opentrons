import React from 'react'
import {connect} from 'react-redux'

import {selectors as robotSelectors} from '../robot'

import RunLog from '../components/RunLog'

const mapStateToProps = (state) => ({
  commands: robotSelectors.getCommands(state)
})

function ConnectedRunLog (props) {
  return (
    <RunLog {...props} />
  )
}

export default connect(mapStateToProps)(ConnectedRunLog)
