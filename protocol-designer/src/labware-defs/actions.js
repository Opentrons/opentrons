// @flow
import assert from 'assert'
import Ajv from 'ajv'
import isEqual from 'lodash/isEqual'
import flatten from 'lodash/flatten'
import values from 'lodash/values'
import uniqBy from 'lodash/uniqBy'
import labwareSchema from '@opentrons/shared-data/labware/schemas/2.json'
import {
  getLabwareDefURI,
  OPENTRONS_LABWARE_NAMESPACE,
} from '@opentrons/shared-data'
import { getIsTiprack } from '../../../shared-data/js/getLabware'
import * as labwareDefSelectors from './selectors'
import { getAllWellSetsForLabware } from '../utils'
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
  |},
|}

export const createCustomLabwareDefAction = (
  payload: $PropertyType<CreateCustomLabwareDef, 'payload'>
): CreateCustomLabwareDef => ({
  type: 'CREATE_CUSTOM_LABWARE_DEF',
  payload,
})

export type ReplaceCustomLabwareDef = {|
  type: 'REPLACE_CUSTOM_LABWARE_DEF',
  payload: {|
    defURIToOverwrite: string,
    newDef: LabwareDefinition2,
    isOverwriteMismatched: boolean,
  |},
|}

export const replaceCustomLabwareDef = (
  payload: $PropertyType<ReplaceCustomLabwareDef, 'payload'>
): ReplaceCustomLabwareDef => ({
  type: 'REPLACE_CUSTOM_LABWARE_DEF',
  payload,
})

const ajv = new Ajv({ allErrors: true, jsonPointers: true })
const validate = ajv.compile(labwareSchema)

const _labwareDefsMatchingLoadName = (
  labwareDefs: Array<LabwareDefinition2>,
  loadName: string
) => labwareDefs.filter(def => def.parameters.loadName === loadName)

const _labwareDefsMatchingDisplayName = (
  labwareDefs: Array<LabwareDefinition2>,
  displayName: string
) =>
  labwareDefs.filter(
    def =>
      def.metadata.displayName.trim().toLowerCase() ===
      displayName.trim().toLowerCase()
  )

const getIsOverwriteMismatched = (
  newDef: LabwareDefinition2,
  overwrittenDef: LabwareDefinition2
): boolean => {
  const matchedWellOrdering = isEqual(newDef.ordering, overwrittenDef.ordering)
  const matchedMultiUse =
    matchedWellOrdering &&
    isEqual(
      getAllWellSetsForLabware(newDef),
      getAllWellSetsForLabware(overwrittenDef)
    )
  return !(matchedWellOrdering && matchedMultiUse)
}

const _createCustomLabwareDef = (onlyTiprack: boolean) => (
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
        messageType: 'NOT_JSON',
      })
    )
  }

  reader.onload = readEvent => {
    const result = ((readEvent.currentTarget: any): FileReader).result
    let parsedLabwareDef: ?LabwareDefinition2

    try {
      parsedLabwareDef = JSON.parse(((result: any): string))
    } catch (error) {
      console.error(error)

      return dispatch(
        labwareUploadMessage({
          messageType: 'INVALID_JSON_FILE',
          errorText: error.message,
        })
      )
    }

    const valid: boolean =
      parsedLabwareDef === null ? false : validate(parsedLabwareDef)
    const hasWellA1 = flatten(parsedLabwareDef?.ordering || []).includes('A1')
    const loadName = parsedLabwareDef?.parameters?.loadName || ''
    const displayName = parsedLabwareDef?.metadata?.displayName || ''

    if (!hasWellA1) {
      console.warn('uploaded labware conforms to schema, but has no well A1!')
    }
    if (!valid || !hasWellA1) {
      return dispatch(
        labwareUploadMessage({
          messageType: 'INVALID_JSON_FILE',
        })
      )
    } else if (onlyTiprack && !getIsTiprack(parsedLabwareDef)) {
      return dispatch(
        labwareUploadMessage({
          messageType: 'ONLY_TIPRACK',
        })
      )
    } else if (parsedLabwareDef?.namespace === OPENTRONS_LABWARE_NAMESPACE) {
      return dispatch(
        labwareUploadMessage({
          messageType: 'USES_STANDARD_NAMESPACE',
        })
      )
    } else if (allLabwareDefs.some(def => isEqual(def, parsedLabwareDef))) {
      return dispatch(
        labwareUploadMessage({
          messageType: 'EXACT_LABWARE_MATCH',
        })
      )
    }

    const defsMatchingCustomLoadName = _labwareDefsMatchingLoadName(
      customLabwareDefs,
      loadName
    )
    const defsMatchingCustomDisplayName = _labwareDefsMatchingDisplayName(
      customLabwareDefs,
      displayName
    )
    if (
      defsMatchingCustomLoadName.length > 0 ||
      defsMatchingCustomDisplayName.length > 0
    ) {
      const matchingDefs = [
        ...defsMatchingCustomLoadName,
        ...defsMatchingCustomDisplayName,
      ]
      assert(
        uniqBy(matchingDefs, getLabwareDefURI).length === 1,
        'expected exactly 1 matching labware def to ask to overwrite'
      )
      return dispatch(
        labwareUploadMessage({
          messageType: 'ASK_FOR_LABWARE_OVERWRITE',
          defsMatchingLoadName: defsMatchingCustomLoadName,
          defsMatchingDisplayName: defsMatchingCustomDisplayName,
          newDef: parsedLabwareDef,
          defURIToOverwrite: getLabwareDefURI(matchingDefs[0]),
          isOverwriteMismatched: getIsOverwriteMismatched(
            parsedLabwareDef,
            matchingDefs[0]
          ),
        })
      )
    }

    const allDefsMatchingLoadName = _labwareDefsMatchingLoadName(
      allLabwareDefs,
      loadName
    )
    const allDefsMatchingDisplayName = _labwareDefsMatchingDisplayName(
      allLabwareDefs,
      displayName
    )
    if (
      allDefsMatchingLoadName.length > 0 ||
      allDefsMatchingDisplayName.length > 0
    ) {
      return dispatch(
        labwareUploadMessage({
          messageType: 'LABWARE_NAME_CONFLICT',
          defsMatchingLoadName: allDefsMatchingLoadName,
          defsMatchingDisplayName: allDefsMatchingDisplayName,
          newDef: parsedLabwareDef,
        })
      )
    }

    return dispatch(
      createCustomLabwareDefAction({
        def: parsedLabwareDef,
      })
    )
  }
  reader.readAsText(file)
}

export const createCustomLabwareDef = _createCustomLabwareDef(false)
export const createCustomTiprackDef = _createCustomLabwareDef(true)

type DismissLabwareUploadMessage = {|
  type: 'DISMISS_LABWARE_UPLOAD_MESSAGE',
|}

export const dismissLabwareUploadMessage = (): DismissLabwareUploadMessage => ({
  type: 'DISMISS_LABWARE_UPLOAD_MESSAGE',
})
