// @flow
import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'
import {actions, selectors} from '../navigation'
import {selectors as fileDataSelectors} from '../file-data'
import {loadFile} from '../load-file'
import FileSidebar from '../components/FileSidebar'
import type {BaseState} from '../types'

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

  return {
    downloadData: fileData && {
      fileContents: JSON.stringify(fileData, null, 4),
      fileName: protocolName + '.json'
    },
    // Ignore clicking 'CREATE NEW' button in these cases
    _canCreateNew: !selectors.newProtocolModal(state)
  }
}

function mergeProps (stateProps: SP & MP, dispatchProps: {dispatch: Dispatch<*>}): Props {
  const {_canCreateNew, downloadData} = stateProps
  const {dispatch} = dispatchProps
  return {
    downloadData,
    loadFile: (parsedProtocol) => dispatch(loadFile(parsedProtocol)),
    onCreateNew: _canCreateNew
      ? () => dispatch(actions.toggleNewProtocolModal(true))
      : undefined
  }
}
