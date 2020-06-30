// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import type { Dispatch } from 'redux'
import {
  selectors as loadFileSelectors,
  actions as loadFileActions,
} from '../../../load-file'
import type { BaseState } from '../../../types'
import { FileUploadMessageModal as FileUploadMessageModalComponent } from './FileUploadMessageModal'

type Props = React.ElementProps<typeof FileUploadMessageModalComponent>

type SP = {|
  message: $PropertyType<Props, 'message'>,
|}

type DP = $Rest<$Exact<Props>, SP>

function mapStateToProps(state: BaseState): SP {
  return {
    message: loadFileSelectors.getFileUploadMessages(state),
  }
}

function mapDispatchToProps(dispatch: Dispatch<*>): DP {
  return {
    cancelProtocolMigration: () => dispatch(loadFileActions.undoLoadFile()),
    dismissModal: () => dispatch(loadFileActions.dismissFileUploadMessage()),
  }
}

export const FileUploadMessageModal: React.AbstractComponent<{||}> = connect<
  Props,
  {||},
  SP,
  DP,
  _,
  _
>(
  mapStateToProps,
  mapDispatchToProps
)(FileUploadMessageModalComponent)
