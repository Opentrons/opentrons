import React from 'react'
import {connect} from 'react-redux'
import {Switch, Route} from 'react-router'
import {push} from 'react-router-redux'
import {AlertModal} from '@opentrons/components'
import UploadStatus from '../components/UploadStatus'
import Page from '../components/Page'

import {
  actions as robotActions
} from '../robot'

export default connect(null, mapDTP)(UploadPage)

function UploadPage (props) {
  const {match: {path}} = props
  return (
    <Page>
      <UploadStatus />
      <Switch>
        <Route exact path={`${path}/confirm`} render={() => {
          return (<ConfirmUploadModal {...props} />)
        }}/>
      </Switch>
    </Page>
  )
}

function mapDTP (dispatch) {
  return {
    cancelUpload: () => { dispatch(push('/upload')) },
    confirmUpload: () => { dispatch(robotActions.clearSession()) }
  }
}

function ConfirmUploadModal (props) {
  return (
    <AlertModal
      heading={'Are you sure you want to open a new protocol?'}
      buttons={[
        {children: 'cancel', onClick: props.cancelUpload},
        {children: 'continue', onClick: props.confirmUpload}
      ]}
      alertOverlay
    >
      Doing so will close your current protocol and clear any unsaved calibration progress.
    </AlertModal>
  )
}
