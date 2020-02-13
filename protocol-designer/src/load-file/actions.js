// @flow
import { migration } from './migration'
import { selectors as featureFlagSelectors } from '../feature-flags'
import type { PDProtocolFile } from '../file-types'
import type { GetState, ThunkAction, ThunkDispatch } from '../types'
import type {
  FileUploadErrorType,
  FileUploadMessage,
  LoadFileAction,
  NewProtocolFields,
} from './types'
export type FileUploadMessageAction = {
  type: 'FILE_UPLOAD_MESSAGE',
  payload: FileUploadMessage,
}

export const fileUploadMessage = (
  payload: FileUploadMessage
): FileUploadMessageAction => ({
  type: 'FILE_UPLOAD_MESSAGE',
  payload,
})

export const dismissFileUploadMessage = () => ({
  type: 'DISMISS_FILE_UPLOAD_MESSAGE',
})

// expects valid, parsed JSON protocol.
export const loadFileAction = (payload: PDProtocolFile): LoadFileAction => ({
  type: 'LOAD_FILE',
  payload: migration(payload),
})

// load file thunk, handles file loading errors
export const loadProtocolFile = (
  event: SyntheticInputEvent<HTMLInputElement>
): ThunkAction<*> => (dispatch: ThunkDispatch<*>, getState: GetState) => {
  const fileError = (errorType: FileUploadErrorType, errorMessage?: string) =>
    dispatch(fileUploadMessage({ isError: true, errorType, errorMessage }))

  const file = event.currentTarget.files[0]
  const reader = new FileReader()

  // reset the state of the input to allow file re-uploads
  event.currentTarget.value = ''

  if (!file.name.endsWith('.json')) {
    fileError('INVALID_FILE_TYPE')
  } else {
    reader.onload = readEvent => {
      const result = ((readEvent.currentTarget: any): FileReader).result
      let parsedProtocol: ?PDProtocolFile

      const modulesEnabled = featureFlagSelectors.getEnableModules(getState())

      try {
        parsedProtocol = JSON.parse(((result: any): string))
        // Protect production PD from weird states you could get from loading a JSON ~v4 protocol with modules
        if ('modules' in parsedProtocol && !modulesEnabled) {
          dispatch(
            fileError(
              'INVALID_JSON_FILE',
              'This protocol appears to contain modules. This is not yet supported in PD.'
            )
          )
        } else {
          // TODO LATER Ian 2018-05-18 validate file with JSON Schema here
          dispatch(loadFileAction(parsedProtocol))
        }
      } catch (error) {
        console.error(error)
        fileError('INVALID_JSON_FILE', error.message)
      }
    }
    reader.readAsText(file)
  }
}

export type UndoLoadFile = {
  type: 'UNDO_LOAD_FILE',
}

// TODO: Ian 2019-06-25 consider making file loading non-committal
// so UNDO_LOAD_FILE doesnt' just reset Redux state
export const undoLoadFile = (): UndoLoadFile => ({
  type: 'UNDO_LOAD_FILE',
})

export type CreateNewProtocolAction = {
  type: 'CREATE_NEW_PROTOCOL',
  payload: NewProtocolFields,
}

export const createNewProtocol = (
  payload: $PropertyType<CreateNewProtocolAction, 'payload'>
): CreateNewProtocolAction => ({
  type: 'CREATE_NEW_PROTOCOL',
  payload,
})

export const saveProtocolFile = () => ({
  type: 'SAVE_PROTOCOL_FILE',
})
