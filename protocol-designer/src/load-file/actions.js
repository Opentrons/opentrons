// @flow
import migrateFile from './migration'
import type {ProtocolFile} from '../file-types'
import type {GetState, ThunkAction, ThunkDispatch} from '../types'
import type {
  FileError,
  LoadFileAction,
  NewProtocolFields,
} from './types'

export const fileErrors = (payload: FileError) => ({
  type: 'FILE_ERRORS',
  payload,
})

// expects valid, parsed JSON protocol.
// TODO: IMMEDIATELY pass boolean `didMigrate` in payload, to effect unsavedChanges reducer
export const loadFileAction = (payload: ProtocolFile): LoadFileAction => ({
  type: 'LOAD_FILE',
  payload: migrateFile(payload),
})

// load file thunk, handles file loading errors
export const loadProtocolFile = (event: SyntheticInputEvent<HTMLInputElement>): ThunkAction<*> =>
  (dispatch: ThunkDispatch<*>, getState: GetState) => {
    const fileError = error => dispatch(fileErrors(error))

    const file = event.currentTarget.files[0]
    const reader = new FileReader()

    // reset the state of the input to allow file re-uploads
    event.currentTarget.value = ''

    if (!file.name.endsWith('.json')) {
      fileError({
        errorType: 'INVALID_FILE_TYPE',
      })
    } else {
      reader.onload = readEvent => {
        const result = readEvent.currentTarget.result
        let parsedProtocol: ?ProtocolFile

        try {
          parsedProtocol = JSON.parse(result)
          // TODO LATER Ian 2018-05-18 validate file with JSON Schema here
        } catch (error) {
          fileError({
            errorType: 'INVALID_JSON_FILE',
            message: error.message,
          })
        }

        if (parsedProtocol) dispatch(loadFileAction(parsedProtocol))
      }
      reader.readAsText(file)
    }
  }

export type CreateNewProtocolAction = {
  type: 'CREATE_NEW_PROTOCOL',
  payload: NewProtocolFields,
}

export const createNewProtocol = (payload: $PropertyType<CreateNewProtocolAction, 'payload'>): CreateNewProtocolAction => ({
  type: 'CREATE_NEW_PROTOCOL',
  payload,
})

export const saveProtocolFile = () => ({
  type: 'SAVE_PROTOCOL_FILE',
})
