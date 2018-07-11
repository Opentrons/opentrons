// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {actions, selectors} from '../../navigation'
import {selectors as fileDataSelectors} from '../../file-data'
import {loadFile} from '../../load-file'
import FileSidebar from './FileSidebar'
import type {BaseState, ThunkDispatch} from '../../types'

type Props = React.ElementProps<typeof FileSidebar>

type SP = {
  downloadData: $PropertyType<Props, 'downloadData'>
}

type MP = {
  _canCreateNew: ?boolean
}

export default connect(mapStateToProps, null, mergeProps)(FileSidebar)

function mapStateToProps (state: BaseState): SP & MP {
  const protocolName = fileDataSelectors.fileMetadata(state).name || 'untitled'
  const fileData = fileDataSelectors.createFile(state)
  const canDownload = selectors.currentPage(state) !== 'file-splash'

  return {
    downloadData: (canDownload)
      ? {
        fileContents: JSON.stringify(fileData, null, 4),
        fileName: protocolName + '.json'
      }
      : null,
    // Ignore clicking 'CREATE NEW' button in these cases
    _canCreateNew: !selectors.newProtocolModal(state)
  }
}

function mergeProps (stateProps: SP & MP, dispatchProps: {dispatch: ThunkDispatch<*>}): Props {
  const {_canCreateNew, downloadData} = stateProps
  const {dispatch} = dispatchProps
  return {
    downloadData,
    loadFile: (fileChangeEvent) => dispatch(loadFile(fileChangeEvent)),
    createNewFile: _canCreateNew
      ? () => dispatch(actions.toggleNewProtocolModal(true))
      : undefined
  }
}
