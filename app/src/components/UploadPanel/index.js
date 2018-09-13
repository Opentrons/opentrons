// @flow
import React from 'react'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'

import {selectors as robotSelectors} from '../../robot'
import {openProtocol} from '../../protocol'

import {SidePanel} from '@opentrons/components'
import Upload from './Upload'

type Props = {
  sessionLoaded: ?boolean,
  uploadError: ? {message: string},
  confirmUpload: () => mixed,
  createSession: () => mixed,
}

export default connect(mapStateToProps, mapDispatchToProps)(UploadPanel)

function UploadPanel (props: Props) {
  return (
    <SidePanel title='Open Protocol'>
      <Upload {...props} />
    </SidePanel>
  )
}

function mapStateToProps (state) {
  return {
    sessionLoaded: robotSelectors.getSessionIsLoaded(state),
    uploadError: robotSelectors.getUploadError(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    confirmUpload: () => dispatch(push('/upload/confirm')),
    createSession: (file) => dispatch(openProtocol(file)),
  }
}
