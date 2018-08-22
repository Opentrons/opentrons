// @flow
import {createSelector} from 'reselect'
import mapValues from 'lodash/mapValues'
import {fileMetadata} from './fileFields'
import {getInitialRobotState, robotStateTimeline} from './commands'
import {selectors as dismissSelectors} from '../../dismiss'
import {selectors as ingredSelectors} from '../../labware-ingred/reducers'
import {selectors as steplistSelectors} from '../../steplist'
import type {BaseState} from '../../types'
import type {ProtocolFile, FilePipette, FileLabware} from '../../file-types'
import type {LabwareData, PipetteData} from '../../step-generation'
import executionDefaults from '../../executionDefaults'

// TODO LATER Ian 2018-02-28 deal with versioning
const protocolSchemaVersion = '1.0.0'
const applicationVersion = process.env.OT_PD_VERSION || 'unknown version'

export const createFile: BaseState => ProtocolFile = createSelector(
  fileMetadata,
  getInitialRobotState,
  robotStateTimeline,
  dismissSelectors.getAllDismissedWarnings,
  ingredSelectors.getIngredientGroups,
  ingredSelectors.getIngredientLocations,
  steplistSelectors.getSavedForms,
  steplistSelectors.orderedSteps,
  (
    fileMetadata,
    initialRobotState,
    _robotStateTimeline,
    dismissedWarnings,
    ingredients,
    ingredLocations,
    savedStepForms,
    orderedSteps
  ) => {
    const {author, description} = fileMetadata
    const name = fileMetadata.name || 'untitled'

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

    // TODO: Ian 2018-07-10 allow user to save steps in JSON file, even if those
    // step never have saved forms.
    // (We could just export the `steps` reducer, but we've sunset it)
    const savedOrderedSteps = orderedSteps.filter(stepId => savedStepForms[stepId])

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

      'default-values': executionDefaults,

      'designer-application': {
        'application-name': 'opentrons/protocol-designer',
        'application-version': applicationVersion,
        data: {
          pipetteTiprackAssignments: mapValues(
            initialRobotState.instruments,
            (p: PipetteData): ?string => p.tiprackModel
          ),
          dismissedWarnings,
          ingredients,
          ingredLocations,
          savedStepForms,
          orderedSteps: savedOrderedSteps
        }
      },

      robot: {
        model: 'OT-2 Standard'
      },

      pipettes: instruments,
      labware,

      procedure: _robotStateTimeline.timeline.map((timelineItem, i) => ({
        annotation: {
          name: `TODO Name ${i}`,
          description: 'todo description'
        },
        subprocedure: timelineItem.commands.reduce((acc, c) => [...acc, c], [])
      }))
    }
  }
)
