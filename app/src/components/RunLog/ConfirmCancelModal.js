// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'
import {AlertModal} from '@opentrons/components'

import {
  actions as robotActions,
} from '../../robot'

type Props = {
  back: () => mixed,
  cancel: () => mixed,
}

const HEADING = 'Are you sure you want to cancel this run?'
const CANCEL_TEXT = 'cancel run'
const BACK_TEXT = 'go back'

const mapDispatchToProps = (dispatch) => ({
  back: () => {
    dispatch(robotActions.resume())
    dispatch(push('/run'))
  },
  cancel: () => {
    dispatch(robotActions.cancel())
    dispatch(push('/run'))
  },
})

function ExitAlertModal (props: Props) {
  const {back, cancel} = props

  return (
    <AlertModal
      heading={HEADING}
      buttons={[
        {children: BACK_TEXT, onClick: back},
        {children: CANCEL_TEXT, onClick: cancel},
      ]}
      alertOverlay
    >
      <p>Doing so will terminate this run and home your robot.</p>
    </AlertModal>
  )
}

export default connect(null, mapDispatchToProps)(ExitAlertModal)
