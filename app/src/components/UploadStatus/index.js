// @flow
// upload progress container
import * as React from 'react'
import {connect} from 'react-redux'

import type {State} from '../../types'

import {selectors as robotSelectors} from '../../robot'
import Status from './Status'

export default connect(mapStateToProps)(Status)

function mapStateToProps (state: State): React.ElementProps<typeof Status> {
  return {
    name: robotSelectors.getSessionName(state),
    uploadInProgress: robotSelectors.getSessionLoadInProgress(state),
    uploadError: robotSelectors.getUploadError(state),
    protocolRunning: robotSelectors.getIsRunning(state),
    protocolDone: robotSelectors.getIsDone(state)
  }
}
