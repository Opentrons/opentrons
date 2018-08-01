// @flow
import React from 'react'
import {connect} from 'react-redux'
import {goBack} from 'react-router-redux'
import {AlertModal} from '@opentrons/components'

import {
  actions as robotActions
} from '../../robot'

type Props = {
  cancelUpload: () => void,
  confirmUpload: () => void,
}

export default connect(null, mapDTP)(ConfirmUploadModal)

function ConfirmUploadModal (props: Props) {
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

function mapDTP (dispatch) {
  return {
    cancelUpload: () => { dispatch(goBack()) },
    confirmUpload: () => { dispatch(robotActions.clearSession()) }
  }
}
