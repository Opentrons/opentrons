import assert from 'assert'
import { connect } from 'react-redux'
import {
  selectors as labwareDefSelectors,
  actions as labwareDefActions,
} from '../../../labware-defs'
import {
  LabwareUploadMessageModal as LabwareUploadMessageModalComponent,
  LabwareUploadMessageModalProps,
} from './LabwareUploadMessageModal'
import { Dispatch } from 'redux'
import { BaseState } from '../../../types'

type Props = LabwareUploadMessageModalProps
interface SP {
  message: Props['message']
}

function mapStateToProps(state: BaseState): SP {
  return {
    message: labwareDefSelectors.getLabwareUploadMessage(state),
  }
}

function mergeProps(
  stateProps: SP,
  dispatchProps: {
    dispatch: Dispatch
  }
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

export const LabwareUploadMessageModal = connect(
  mapStateToProps,
  null,
  mergeProps
)(LabwareUploadMessageModalComponent)
