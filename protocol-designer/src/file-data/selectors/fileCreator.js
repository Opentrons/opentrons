// @flow
import {createSelector} from 'reselect'
import mapValues from 'lodash/mapValues'
import type {BaseState} from '../../types'
import type {ProtocolFile} from '../types'
import type {LabwareData, PipetteData} from '../../step-generation'
import {fileFormValues} from './fileFields'
import {getInitialRobotState, robotStateTimeline} from './commands'

// TODO LATER Ian 2018-02-28 deal with versioning
const protocolSchemaVersion = '1.0.0'
const applicationVersion = '1.0.0'

export const createFile: BaseState => ?ProtocolFile = createSelector(
  fileFormValues,
  getInitialRobotState,
  robotStateTimeline,
  (fileFormValues, initialRobotState, timeline) => {
    const {author, description} = fileFormValues
    const name = fileFormValues.name || 'untitled'
    const isValidFile = true // TODO Ian 2018-02-28 this will be its own selector

    if (!isValidFile) {
      return null
    }

    const instruments = mapValues(
      initialRobotState.instruments,
      (pipette: PipetteData) => ({
        type: 'pipette',
        mount: pipette.mount,
        channels: pipette.channels,
        model: pipette.maxVolume
      })
    )

    const labware = mapValues(
      initialRobotState.labware,
      (l: LabwareData) => ({
        slot: l.slot,
        name: l.name || l.type, // TODO "humanize" it, or force naming of labware
        type: l.type
      })
    )

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

      instruments,
      labware,

      commands: timeline.map(timelineItem => ({
        annotation: {
          name: 'TODO Name',
          description: 'todo description'
        },
        commands: timelineItem.commands.reduce((acc, c) => [...acc, c], [])
      }))
    }
  }
)
