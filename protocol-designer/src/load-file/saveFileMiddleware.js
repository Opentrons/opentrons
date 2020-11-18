// @flow
import { saveAs } from 'file-saver'
import { selectors as fileDataSelectors } from '../file-data'
import type { Middleware } from 'redux'
import type { PDProtocolFile } from '../file-types'
import type { BaseState } from '../types'

export const saveFile = (fileData: PDProtocolFile, fileName: string) => {
  const blob = new Blob([JSON.stringify(fileData)], {
    type: 'application/json',
  })
  saveAs(blob, fileName)
}

// Upon SAVE_PROTOCOL_FILE, apply the action to the file data
// and then side-effect to actually save the file
export const saveFileMiddleware: Middleware<BaseState, any> = ({
  getState,
  dispatch,
}) => next => action => {
  const result = next(action)

  // NOTE: this is the Redux state AFTER the action has been fully dispatched
  // (SAVE_PROTOCOL_FILE needs to run thru reducers so lastModified gets updated)
  const state = getState()

  if (action.type === 'SAVE_PROTOCOL_FILE') {
    const fileData = fileDataSelectors.createFile(state)

    const protocolName =
      fileDataSelectors.getFileMetadata(state).protocolName || 'untitled'
    const fileName = `${protocolName}.json`

    saveFile(fileData, fileName)
  }
  return result
}
