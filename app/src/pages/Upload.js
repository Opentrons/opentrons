// @flow
// upload progress container
import * as React from 'react'
import {connect} from 'react-redux'

import type {State} from '../types'

import {selectors as robotSelectors} from '../robot'
import {Splash, SpinnerModal} from '@opentrons/components'
import Page from '../components/Page'
import UploadStatus from '../components/UploadStatus'

type Props = {
  name: string,
  uploadInProgress: boolean,
  uploadError: ?{message: string},
  protocolRunning: boolean,
  protocolDone: boolean,
}

export default connect(mapStateToProps)(UploadPage)

function mapStateToProps (state: State): Props {
  return {
    name: robotSelectors.getSessionName(state),
    uploadInProgress: robotSelectors.getSessionLoadInProgress(state),
    uploadError: robotSelectors.getUploadError(state),
    protocolRunning: robotSelectors.getIsRunning(state),
    protocolDone: robotSelectors.getIsDone(state)
  }
}

function UploadPage (props: Props) {
  const {name, uploadInProgress, uploadError} = props
  if (!name && !uploadInProgress && !uploadError) return (<Page><Splash /></Page>)
  if (uploadInProgress) return (<Page><SpinnerModal message='Upload in Progress'/></Page>)
  return (
    <Page>
      <UploadStatus {...props}/>
    </Page>
  )
}
