// @flow
import {createSelector} from 'reselect'
import type {BaseState} from '../../types'
import type {ProtocolFile} from '../types'
import {fileFormValues} from './fileFields'

// TODO LATER Ian 2018-02-28 deal with versioning
const protocolSchemaVersion = '1.0.0'
const applicationVersion = '1.0.0'

export const createFile: BaseState => ?ProtocolFile = createSelector(
  fileFormValues,
  (fileFormValues) => {
    const {author, description} = fileFormValues
    const name = fileFormValues.name || 'untitled'
    const isValidFile = true // TODO Ian 2018-02-28 this will be its own selector

    if (!isValidFile) {
      return null
    }

    return {
      'protocol-schema': protocolSchemaVersion,

      metadata: {
        'protocol-name': name,
        author,
        description,
        created: Date.now(),
        'last-modified': null,
        category: null,
        subcategory: null,
        tags: []
      },

      'designer-application': {
        'application-name': 'opentrons/protocol-designer',
        'application-version': applicationVersion,
        data: {/* TODO */}
      },

      robot: {
        model: 'OT-2 Standard'
      },

      instruments: {
        // TODO
      },

      labware: {
        // TODO
      },

      commands: [
        // TODO
      ]
    }
  }
)
