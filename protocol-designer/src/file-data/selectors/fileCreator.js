// @flow
import {createSelector} from 'reselect'
import mapValues from 'lodash/mapValues'
import type {BaseState} from '../../types'
import type {ProtocolFile, FilePipette, FileLabware} from '../types'
import type {LabwareData, PipetteData} from '../../step-generation'
import {fileFormValues} from './fileFields'
import {getInitialRobotState, robotStateTimelineFull} from './commands'

// TODO LATER Ian 2018-02-28 deal with versioning
const protocolSchemaVersion = '1.0.0'
const applicationVersion = '1.0.0'

export const createFile: BaseState => ?ProtocolFile = createSelector(
  fileFormValues,
  getInitialRobotState,
  robotStateTimelineFull,
  (fileFormValues, initialRobotState, _robotStateTimelineFull) => {
    const {author, description} = fileFormValues
    const name = fileFormValues.name || 'untitled'
    const isValidFile = true // TODO Ian 2018-02-28 this will be its own selector

    if (!isValidFile) {
      return null
    }

    const instruments = mapValues(
      initialRobotState.instruments,
      (pipette: PipetteData): FilePipette => ({
        mount: pipette.mount,
        // TODO HACK Ian 2018-05-11 use pipette definitions in labware-definitions
        model: `p${pipette.maxVolume}_${pipette.channels === 1 ? 'single' : 'multi'}_v1` // eg p10_single_v1
      })
    )

    const labware = mapValues(
      initialRobotState.labware,
      (l: LabwareData): FileLabware => ({
        slot: l.slot,
        'display-name': l.name || l.type, // TODO Ian 2018-05-11 "humanize" type when no name?
        model: l.type
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

      pipettes: instruments,
      labware,

      procedure: _robotStateTimelineFull.timeline.map((timelineItem, i) => ({
        annotation: {
          name: `TODO Name ${i}`,
          description: 'todo description'
        },
        subprocedure: timelineItem.commands.reduce((acc, c) => [...acc, c], [])
      }))
    }
  }
)
