import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import {
  selectors as loadFileSelectors,
  actions as loadFileActions,
} from '../../../load-file'
import { BaseState } from '../../../types'
import {
  FileUploadMessageModal as FileUploadMessageModalComponent,
  FileUploadMessageModalProps,
} from './FileUploadMessageModal'

type Props = FileUploadMessageModalProps
interface SP {
  message: Props['message']
}
type DP = Omit<Props, keyof SP>

function mapStateToProps(state: BaseState): SP {
  return {
    message: loadFileSelectors.getFileUploadMessages(state),
  }
}

function mapDispatchToProps(dispatch: Dispatch): DP {
  return {
    cancelProtocolMigration: () => dispatch(loadFileActions.undoLoadFile()),
    dismissModal: () => dispatch(loadFileActions.dismissFileUploadMessage()),
  }
}

export const FileUploadMessageModal = connect(
  mapStateToProps,
  mapDispatchToProps
)(FileUploadMessageModalComponent)
