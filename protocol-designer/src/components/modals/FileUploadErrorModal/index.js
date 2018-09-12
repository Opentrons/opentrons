// @flow
import * as React from 'react'
import FileUploadErrorModal from './FileUploadErrorModal'
import {connect} from 'react-redux'
import {selectors as loadFileSelectors, actions as loadFileActions} from '../../../load-file'
import type {Dispatch} from 'redux'
import type {BaseState} from '../../../types'

type Props = React.ElementProps<typeof FileUploadErrorModal>

type SP = {
  error: $PropertyType<Props, 'error'>,
}

type DP = $Diff<Props, SP>

function mapStateToProps (state: BaseState): SP {
  return {
    error: loadFileSelectors.getFileLoadErrors(state),
  }
}

function mapDispatchToProps (dispatch: Dispatch<*>): DP {
  return {
    dismissModal: () => dispatch(loadFileActions.fileErrors(null)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(FileUploadErrorModal)
