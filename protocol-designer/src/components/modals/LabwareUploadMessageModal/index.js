// @flow
import assert from 'assert'
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

function mapStateToProps(state: BaseState): SP {
  return {
    message: labwareDefSelectors.getLabwareUploadMessage(state),
  }
}

function mergeProps(
  stateProps: SP,
  dispatchProps: { dispatch: Dispatch<any> }
): Props {
  const { dispatch } = dispatchProps
  const { message } = stateProps
  return {
    ...stateProps,
    overwriteLabwareDef: () => {
      if (message && message.messageType === 'ASK_FOR_LABWARE_OVERWRITE') {
        dispatch(
          labwareDefActions.replaceCustomLabwareDef({
            defURIToOverwrite: message.defURIToOverwrite,
            newDef: message.newDef,
            isOverwriteMismatched: message.isOverwriteMismatched,
          })
        )
      } else {
        assert(
          false,
          `labware def should only be overwritten when messageType is ASK_FOR_LABWARE_OVERWRITE. Got ${String(
            message?.messageType
          )}`
        )
      }
    },
    dismissModal: () =>
      dispatch(labwareDefActions.dismissLabwareUploadMessage()),
  }
}

export default connect<Props, {||}, SP, _, _, _>(
  mapStateToProps,
  null,
  mergeProps
)(LabwareUploadMessageModal)
