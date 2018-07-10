// @flow
import type {ProtocolFile} from '../file-types'
import type {ActionType} from 'redux-actions'
import type {GetState, ThunkAction, ThunkDispatch} from '../types'
import type {FileError} from './types'

export const LOAD_FILE: 'LOAD_FILE' = 'LOAD_FILE'

export const fileErrors = (payload: FileError) => ({
  type: 'FILE_ERRORS',
  payload
})

// expects valid, parsed JSON protocol.
const loadFileAction = (payload: ProtocolFile) => ({
  type: LOAD_FILE,
  payload
})

// load file thunk, handles file loading errors
export const loadFile = (event: SyntheticInputEvent<HTMLInputElement>): ThunkAction<*> =>
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
        errorType: 'INVALID_FILE_TYPE'
      })
    } else {
      reader.onload = readEvent => {
        const result = readEvent.currentTarget.result

        try {
          parseAndLoadFile(result)
        } catch (error) {
          fileError({
            errorType: 'INVALID_JSON_FILE',
            message: error.message
          })
        }
      }
      reader.readAsText(file)
    }
  }

export type LoadFileAction = ActionType<typeof loadFile>
