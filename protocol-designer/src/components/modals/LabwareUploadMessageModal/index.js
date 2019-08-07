// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import {
  selectors as labwareDefSelectors,
  actions as labwareDefActions,
} from '../../../labware-defs'
import LabwareUploadMessageModal from './LabwareUploadMessageModal'
import type { Dispatch } from 'redux'
import type { BaseState } from '../../../types'

type Props = React.ElementProps<typeof LabwareUploadMessageModal>

type SP = {|
  message: $PropertyType<Props, 'message'>,
|}

type DP = $Rest<$Exact<Props>, SP>

function mapStateToProps(state: BaseState): SP {
  return {
    message: labwareDefSelectors.getLabwareUploadMessage(state),
  }
}

function mapDispatchToProps(dispatch: Dispatch<any>): DP {
  return {
    overwriteLabware: () => dispatch(labwareDefActions.overwriteLabware()),
    dismissModal: () =>
      dispatch(labwareDefActions.dismissLabwareUploadMessage()),
  }
}

export default connect<Props, {||}, SP, DP, _, _>(
  mapStateToProps,
  mapDispatchToProps
)(LabwareUploadMessageModal)
