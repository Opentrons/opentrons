// @flow
import React from 'react'
import {connect} from 'react-redux'
import type {State} from '../../types'
import {
  selectors as robotSelectors,
  type SessionStatus
} from '../../robot'

import CommandList from './CommandList'

type SP = {
  commands: Array<any>,
  sessionStatus: SessionStatus
}

type Props = SP

const mapStateToProps = (state: State): SP => ({
  commands: robotSelectors.getCommands(state),
  sessionStatus: robotSelectors.getSessionStatus(state),
  cancelInProgress: robotSelectors.getCancelInProgress(state)
})

function RunLog (props: Props) {
  return (
    <CommandList {...props} />
  )
}

export default connect(mapStateToProps)(RunLog)
