// @flow
import React from 'react'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'

import {
  actions as robotActions,
  selectors as robotSelectors
} from '../../robot'

import {SidePanel} from '@opentrons/components'
import Upload from './Upload'

type Props = {
  sessionLoaded: ?boolean,
  confirmUpload: () => void,
  createSession: () => void,
}

export default connect(mapStateToProps, mapDispatchToProps)(UploadPanel)

function UploadPanel (props: Props) {
  return (
    <SidePanel title='Open Protocol'>
      <Upload {...props}/>
    </SidePanel>
  )
}

function mapStateToProps (state) {
  return {
    sessionLoaded: robotSelectors.getSessionIsLoaded(state)
  }
}

function mapDispatchToProps (dispatch) {
  return {
    confirmUpload: () => {
      dispatch(push('/upload/confirm'))
    },
    createSession: (file) => {
      dispatch(robotActions.session(file))
    }
  }
}
