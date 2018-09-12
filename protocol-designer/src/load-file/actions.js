// @flow
import type {ProtocolFile} from '../file-types'
import type {GetState, ThunkAction, ThunkDispatch} from '../types'
import type {FileError, LoadFileAction, NewProtocolFields} from './types'

export const fileErrors = (payload: FileError) => ({
  type: 'FILE_ERRORS',
  payload,
})

// expects valid, parsed JSON protocol.
const loadFileAction = (payload: ProtocolFile): LoadFileAction => ({
  type: 'LOAD_FILE',
  payload,
})

// load file thunk, handles file loading errors
export const loadProtocolFile = (event: SyntheticInputEvent<HTMLInputElement>): ThunkAction<*> =>
  (dispatch: ThunkDispatch<*>, getState: GetState) => {
    const parseAndLoadFile = fileBody => {
      const parsedProtocol: ProtocolFile = JSON.parse(fileBody)
      // TODO LATER Ian 2018-05-18 validate file with JSON Schema here
      dispatch(loadFileAction(parsedProtocol))
    }
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

        try {
          parseAndLoadFile(result)
        } catch (error) {
          fileError({
            errorType: 'INVALID_JSON_FILE',
            message: error.message,
          })
        }
      }
      reader.readAsText(file)
    }
  }

export const createNewProtocol = (payload: NewProtocolFields) => ({
  type: 'CREATE_NEW_PROTOCOL',
  payload,
})

export const saveProtocolFile = () => ({
  type: 'SAVE_PROTOCOL_FILE',
})
