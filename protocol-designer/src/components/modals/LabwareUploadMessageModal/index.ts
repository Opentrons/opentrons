import {
  selectors as labwareDefSelectors,
  actions as labwareDefActions,
} from '../../../labware-defs'
import { BaseState } from '../../../types'
import {
  LabwareUploadMessageModal as LabwareUploadMessageModalComponent,
  LabwareUploadMessageModalProps,
} from './LabwareUploadMessageModal'
import assert from 'assert'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

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
  // @ts-expect-error(sa, 2021-6-21): TODO: refactor to use hooks api
  null,
  mergeProps
)(LabwareUploadMessageModalComponent)
