import { $Diff } from 'utility-types'
import * as React from 'react'
import { FileUploadMessageModal as FileUploadMessageModalComponent } from './FileUploadMessageModal'
import { connect } from 'react-redux'
import {
  selectors as loadFileSelectors,
  actions as loadFileActions,
} from '../../../load-file'
import { Dispatch } from 'redux'
import { BaseState } from '../../../types'
type Props = React.ElementProps<typeof FileUploadMessageModalComponent>
type SP = {
  message: Props['message']
}
type DP = $Diff<Props, SP>

function mapStateToProps(state: BaseState): SP {
  return {
    message: loadFileSelectors.getFileUploadMessages(state),
  }
}

function mapDispatchToProps(dispatch: Dispatch<any>): DP {
  return {
    cancelProtocolMigration: () => dispatch(loadFileActions.undoLoadFile()),
    dismissModal: () => dispatch(loadFileActions.dismissFileUploadMessage()),
  }
}

export const FileUploadMessageModal: React.AbstractComponent<{}> = connect<
  Props,
  {},
  SP,
  DP,
  _,
  _
>(
  mapStateToProps,
  mapDispatchToProps
)(FileUploadMessageModalComponent)
