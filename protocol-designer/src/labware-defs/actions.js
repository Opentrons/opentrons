// @flow
import type { GetState, ThunkAction, ThunkDispatch } from '../types'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

// TODO IMMEDIATELY move types to ./types.js
export type LabwareUploadErrorType = 'INVALID_JSON_FILE' | 'TODO'

// TODO IMMEDIATELY do we ever need a non-error message?
export type LabwareUploadMessage =
  | {
      isError: false,
    }
  | {
      isError: true,
      errorType: LabwareUploadErrorType,
      errorMessage?: string,
    }

export type LabwareUploadMessageAction = {
  type: 'LABWARE_UPLOAD_MESSAGE',
  payload: LabwareUploadMessage,
}

export const labwareUploadMessage = (
  payload: LabwareUploadMessage
): LabwareUploadMessageAction => ({
  type: 'LABWARE_UPLOAD_MESSAGE',
  payload,
})

export type CreateCustomLabwareDef = {
  type: 'CREATE_CUSTOM_LABWARE_DEF',
  payload: {
    def: LabwareDefinition2,
  },
}

const createCustomLabwareDefAction = (
  payload: $PropertyType<CreateCustomLabwareDef, 'payload'>
): CreateCustomLabwareDef => ({
  type: 'CREATE_CUSTOM_LABWARE_DEF',
  payload,
})

export const createCustomLabwareDef = (
  event: SyntheticInputEvent<HTMLInputElement>
): ThunkAction<*> => (dispatch: ThunkDispatch<*>, getState: GetState) => {
  const fileError = (
    errorType: LabwareUploadErrorType,
    errorMessage?: string
  ) =>
    dispatch(labwareUploadMessage({ isError: true, errorType, errorMessage }))

  const file = event.currentTarget.files[0]
  const reader = new FileReader()

  // reset the state of the input to allow file re-uploads
  event.currentTarget.value = ''

  reader.onload = readEvent => {
    const result = readEvent.currentTarget.result
    let parsedLabwareDef: ?LabwareDefinition2

    // TODO: Ian 2019-08-05 all the error messaging described in product doc
    try {
      parsedLabwareDef = JSON.parse(result)
      // TODO LATER Ian 2019-08-05 validate file with JSON Schema here
      dispatch(createCustomLabwareDefAction({ def: parsedLabwareDef }))
    } catch (error) {
      console.error(error)
      fileError('INVALID_JSON_FILE', error.message)
    }
  }
  reader.readAsText(file)
}
