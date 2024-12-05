import { CUSTOM_LABWARE_DICT_NAME } from '@opentrons/step-generation'

import { selectors as fileDataSelectors } from '../file-data'
import { migration } from './migration'
import { saveFile, savePythonFile } from './utils'
import { pythonProtoParserDemo } from './pythondemo'

import type { SyntheticEvent } from 'react'
import type { PDProtocolFile, PythonDesignerApplication } from '../file-types'
import type { GetState, ThunkAction, ThunkDispatch } from '../types'
import type {
  FileUploadErrorType,
  FileUploadMessage,
  LoadFileAction,
  NewProtocolFields,
} from './types'

export interface FileUploadMessageAction {
  type: 'FILE_UPLOAD_MESSAGE'
  payload: FileUploadMessage
}
export const fileUploadMessage = (
  payload: FileUploadMessage
): FileUploadMessageAction => ({
  type: 'FILE_UPLOAD_MESSAGE',
  payload,
})
export interface DismissFileUploadMessageAction {
  type: 'DISMISS_FILE_UPLOAD_MESSAGE'
}
export const dismissFileUploadMessage = (): DismissFileUploadMessageAction => ({
  type: 'DISMISS_FILE_UPLOAD_MESSAGE',
})
// expects valid, parsed JSON protocol.
export const loadFileAction = (
  payload: PDProtocolFile | PythonDesignerApplication
): LoadFileAction => ({
  type: 'LOAD_FILE',
  payload: migration(payload),
})
// load file thunk, handles file loading errors
export const loadProtocolFile = (
  event: SyntheticEvent<HTMLInputElement>
): ThunkAction<any> => (dispatch: ThunkDispatch<any>, getState: GetState) => {
  const fileError = (
    errorType: FileUploadErrorType,
    errorMessage?: string
  ): void =>
    dispatch(
      fileUploadMessage({
        isError: true,
        errorType,
        errorMessage,
      })
    )

  // @ts-expect-error need null checking
  const file = event.currentTarget.files[0]
  const reader = new FileReader()
  // reset the state of the input to allow file re-uploads
  event.currentTarget.value = ''

  if (!file.name.endsWith('.json') && !file.name.endsWith('.py')) {
    fileError('INVALID_FILE_TYPE')
  } else if (file.name.endsWith('.json')) {
    reader.onload = readEvent => {
      const result = ((readEvent.currentTarget as any) as FileReader).result
      let parsedProtocol: PDProtocolFile | null | undefined

      try {
        if (file.name.endsWith('.py')) {
          pythonProtoParserDemo(result, file.name)
        } else {
          parsedProtocol = JSON.parse((result as any) as string)
        }
        // TODO LATER Ian 2018-05-18 validate file with JSON Schema here
        parsedProtocol && dispatch(loadFileAction(parsedProtocol))
      } catch (error) {
        console.error(error)
        if (error instanceof Error) {
          fileError('INVALID_JSON_FILE', error.message)
        }
      }
    }

    reader.readAsText(file)
  } else {
    reader.onload = readEvent => {
      const result = (readEvent.currentTarget as FileReader).result as string

      try {
        // Extract designer application blob
        const designerApplication = result.match(
          /^DESIGNER_APPLICATION\s?=\s?"""(.*)"""/m
        )
        if (designerApplication != null && designerApplication[1]) {
          const designerApplicationString = designerApplication[1]
          const designerApplicationJson = JSON.parse(designerApplicationString) // Convert to JSON

          const customLabwareRegex = new RegExp(
            `^${CUSTOM_LABWARE_DICT_NAME}\\s*=\\s*json.loads\\("""(.*)"""\\)`,
            'm'
          )
          const customLabware = result.match(customLabwareRegex)
          let customLabwareJson
          if (customLabware != null && customLabware[1]) {
            const customLabwareString = customLabware[1]
            customLabwareJson = JSON.parse(customLabwareString)
          }
          dispatch(
            loadFileAction(
              (customLabwareJson != null
                ? {
                    ...designerApplicationJson,
                    //  NOTE: labwareDefinitions contain custom labware only
                    //  other labwareDefinitions are populated via mapping through
                    //  the labware key in the labwareInvariantProperties reducer
                    labwareDefinitions: customLabwareJson,
                  }
                : designerApplicationJson) as PythonDesignerApplication
            )
          )
        } else {
          fileError('INVALID_PYTHON_FILE')
        }
      } catch (error) {
        console.error('Error extracting blob:', error)
        if (error instanceof Error) {
          fileError('INVALID_PYTHON_FILE', error.message)
        }
      }
    }

    reader.readAsText(file)
  }
}
export interface UndoLoadFile {
  type: 'UNDO_LOAD_FILE'
}
// TODO: Ian 2019-06-25 consider making file loading non-committal
// so UNDO_LOAD_FILE doesnt' just reset Redux state
export const undoLoadFile = (): UndoLoadFile => ({
  type: 'UNDO_LOAD_FILE',
})
export interface CreateNewProtocolAction {
  type: 'CREATE_NEW_PROTOCOL'
  payload: NewProtocolFields
}
export const createNewProtocol = (
  payload: CreateNewProtocolAction['payload']
): CreateNewProtocolAction => ({
  type: 'CREATE_NEW_PROTOCOL',
  payload,
})
export interface SaveProtocolFileAction {
  type: 'SAVE_PROTOCOL_FILE'
}
export const saveProtocolFile: () => ThunkAction<SaveProtocolFileAction> = () => (
  dispatch,
  getState
) => {
  // dispatching this should update the state, eg lastModified timestamp
  dispatch({
    type: 'SAVE_PROTOCOL_FILE',
  })
  const state = getState()
  const fileData = fileDataSelectors.createFile(state)
  const protocolName =
    fileDataSelectors.getFileMetadata(state).protocolName || 'untitled'
  const fileName = `${protocolName}.json`
  saveFile(fileData, fileName)
}
// Eventually this will replace saveProtocolFile:
export const savePythonProtocolFile: () => ThunkAction<SaveProtocolFileAction> = () => (
  dispatch,
  getState
) => {
  // dispatching this should update the state, eg lastModified timestamp
  dispatch({
    type: 'SAVE_PROTOCOL_FILE',
  })
  const state = getState()
  const fileData = fileDataSelectors.createPythonFile(state)
  const protocolName =
    fileDataSelectors.getFileMetadata(state).protocolName || 'untitled'
  // unlike JSON files, Python filenames can't have funny characters
  const fileName = `${protocolName
    .trim()
    .replace(/\S+/g, '_')
    .replace(/[^A-Za-z0-9_]/g, '')}.py`
  savePythonFile(fileData, fileName)
}
