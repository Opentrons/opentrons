// @flow
import assert from 'assert'
import Ajv from 'ajv'
import isEqual from 'lodash/isEqual'
import values from 'lodash/values'
import labwareSchema from '@opentrons/shared-data/labware/schemas/2.json'
import * as labwareDefSelectors from './selectors'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { GetState, ThunkAction, ThunkDispatch } from '../types'
import type { LabwareUploadMessage } from './types'

export type LabwareUploadMessageAction = {|
  type: 'LABWARE_UPLOAD_MESSAGE',
  payload: LabwareUploadMessage,
|}

export const labwareUploadMessage = (
  payload: LabwareUploadMessage
): LabwareUploadMessageAction => ({
  type: 'LABWARE_UPLOAD_MESSAGE',
  payload,
})

export type CreateCustomLabwareDef = {|
  type: 'CREATE_CUSTOM_LABWARE_DEF',
  payload: {|
    def: LabwareDefinition2,
    overwrite: boolean,
  |},
|}

const createCustomLabwareDefAction = (
  payload: $PropertyType<CreateCustomLabwareDef, 'payload'>
): CreateCustomLabwareDef => ({
  type: 'CREATE_CUSTOM_LABWARE_DEF',
  payload,
})

const ajv = new Ajv({ allErrors: true, jsonPointers: true })
const validate = ajv.compile(labwareSchema)

const _labwareDefsMatchLoadName = (
  labwareDefs: Array<LabwareDefinition2>,
  loadName: string
) => labwareDefs.some(def => def.parameters.loadName === loadName)

const _labwareDefsMatchDisplayName = (
  labwareDefs: Array<LabwareDefinition2>,
  displayName: string
) =>
  labwareDefs.some(
    def =>
      def.metadata.displayName.trim().toLowerCase() ===
      displayName.trim().toLowerCase()
  )

export const createCustomLabwareDef = (
  event: SyntheticInputEvent<HTMLInputElement>
): ThunkAction<*> => (dispatch: ThunkDispatch<*>, getState: GetState) => {
  const allLabwareDefs: Array<LabwareDefinition2> = values(
    labwareDefSelectors.getLabwareDefsByURI(getState())
  )
  const customLabwareDefs: Array<LabwareDefinition2> = values(
    labwareDefSelectors.getCustomLabwareDefsByURI(getState())
  )

  const file = event.currentTarget.files[0]
  const reader = new FileReader()

  // reset the state of the input to allow file re-uploads
  event.currentTarget.value = ''

  if (!file.name.match(/\.json$/i)) {
    return dispatch(
      labwareUploadMessage({
        messageType: 'INVALID_JSON_FILE',
        message:
          "The Protocol Designer only accepts custom JSON labware definitions made with our Labware Creator. This isn't a .json file!",
      })
    )
  }

  reader.onload = readEvent => {
    const result = readEvent.currentTarget.result
    let parsedLabwareDef: ?LabwareDefinition2

    // TODO: Ian 2019-08-05 all the error messaging described in product doc
    try {
      parsedLabwareDef = JSON.parse(result)
    } catch (error) {
      console.error(error)

      return dispatch(
        labwareUploadMessage({
          messageType: 'INVALID_JSON_FILE',
          message: error.message,
        })
      )
    }

    const valid: boolean =
      parsedLabwareDef === null ? false : validate(parsedLabwareDef)
    const loadName = parsedLabwareDef?.parameters?.loadName || ''
    const displayName = parsedLabwareDef?.metadata?.displayName || ''

    if (!valid) {
      console.debug('validation errors:', validate.errors)
      return dispatch(
        labwareUploadMessage({
          messageType: 'INVALID_JSON_FILE',
          message:
            'The Protocol Designer only accepts custom JSON labware definitions made with our Labware Creator',
        })
      )
    } else if (allLabwareDefs.some(def => isEqual(def, parsedLabwareDef))) {
      return dispatch(
        labwareUploadMessage({
          messageType: 'EXACT_LABWARE_MATCH',
          message: 'This labware is already available to use.',
        })
      )
    } else if (
      _labwareDefsMatchLoadName(customLabwareDefs, loadName) ||
      _labwareDefsMatchDisplayName(customLabwareDefs, displayName)
    ) {
      return dispatch(
        labwareUploadMessage({
          messageType: 'ASK_FOR_LABWARE_OVERWRITE',
          message:
            'The load name and/or display name matches that of another CUSTOM labware',
          pendingDef: parsedLabwareDef,
        })
      )
    } else if (
      _labwareDefsMatchLoadName(allLabwareDefs, loadName) ||
      _labwareDefsMatchDisplayName(allLabwareDefs, displayName)
    ) {
      return dispatch(
        labwareUploadMessage({
          messageType: 'LABWARE_NAME_CONFLICT',
          message:
            'The load name and/or display name matches that of another STANDARD labware',
        })
      )
    } else {
      return dispatch(
        createCustomLabwareDefAction({
          def: parsedLabwareDef,
          overwrite: false,
        })
      )
    }
  }
  reader.readAsText(file)
}

export const overwriteLabware = (): ThunkAction<*> => (
  dispatch: ThunkDispatch<*>,
  getState: GetState
) => {
  // get def used to overwrite existing def from the labware upload message
  const def = labwareDefSelectors.getLabwareUploadMessage(getState())
    ?.pendingDef
  if (def) {
    dispatch(createCustomLabwareDefAction({ def, overwrite: true }))
  } else {
    assert(
      false,
      'overwriteLabware thunk expected pendingDef in labwareUploadMessage'
    )
  }
}

type DismissLabwareUploadMessage = {|
  type: 'DISMISS_LABWARE_UPLOAD_MESSAGE',
|}

export const dismissLabwareUploadMessage = (): DismissLabwareUploadMessage => ({
  type: 'DISMISS_LABWARE_UPLOAD_MESSAGE',
})
