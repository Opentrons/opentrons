// @flow
import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'
import {actions, selectors} from '../navigation'
import {selectors as fileDataSelectors} from '../file-data'
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
    onUpload: (event) => {
      const file = event.currentTarget.files[0]
      const reader = new FileReader()

      if (file.name.endsWith('.py')) {
        // TODO LATER Ian 2018-05-18 use a real modal
        window.alert('Protocol Designer does not support Python (*.py) protocol files.\n\nPlease use a text editor to edit Python protocol files.')
      } else {
        reader.onload = readEvent => {
          const result = readEvent.currentTarget.result

          try {
            const parsedProtocol = JSON.parse(result)
            // TODO LATER Ian 2018-05-18 validate file with JSON Schema here

            // TODO IMMEDIATELY (next PR) dispatch a FILE_UPLOAD action
            console.log({parsedProtocol})
          } catch (error) {
            // TODO LATER Ian 2018-05-18 use a real modal
            window.alert(`Could not parse JSON protocol.\n\nError message: "${error.message}"`)
          }
        }
        reader.readAsText(file)
      }

      // reset the state of the input to allow file re-uploads
      event.currentTarget.value = ''
    },
    onCreateNew: _canCreateNew
      ? () => dispatch(actions.toggleNewProtocolModal(true))
      : undefined
  }
}
