// @flow
import { createSelector } from 'reselect'
import mapValues from 'lodash/mapValues'
import isEmpty from 'lodash/isEmpty'
import { getFlowRateDefaultsAllPipettes } from '@opentrons/shared-data'
import { getFileMetadata } from './fileFields'
import { getInitialRobotState, getRobotStateTimeline } from './commands'
import { selectors as dismissSelectors } from '../../dismiss'
import { selectors as ingredSelectors } from '../../labware-ingred/selectors'
import { selectors as stepFormSelectors } from '../../step-forms'
import { selectors as uiLabwareSelectors } from '../../ui/labware'
import {
  DEFAULT_MM_FROM_BOTTOM_ASPIRATE,
  DEFAULT_MM_FROM_BOTTOM_DISPENSE,
  DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP,
} from '../../constants'
import type {
  FilePipetteV1 as FilePipette,
  FileLabwareV1 as FileLabware,
} from '@opentrons/shared-data'
import type { BaseState } from '../../types'
import type { PDProtocolFile } from '../../file-types'

// TODO LATER Ian 2018-02-28 deal with versioning
const protocolSchemaVersion = '1.0.0'

// TODO: BC: 2018-02-21 uncomment this assert, causes test failures
// assert(!isEmpty(process.env.OT_PD_VERSION), 'Could not find application version!')
if (isEmpty(process.env.OT_PD_VERSION))
  console.warn('Could not find application version!')
const applicationVersion = process.env.OT_PD_VERSION

// Internal release date: this should never be read programatically,
// it just helps us humans quickly identify what build a user was using
// when we look at saved protocols (without requiring us to trace thru git logs)
const _internalAppBuildDate = process.env.OT_PD_BUILD_DATE

const executionDefaults: $PropertyType<PDProtocolFile, 'default-values'> = {
  'aspirate-flow-rate': getFlowRateDefaultsAllPipettes(
    'defaultAspirateFlowRate'
  ),
  'dispense-flow-rate': getFlowRateDefaultsAllPipettes(
    'defaultDispenseFlowRate'
  ),
  'aspirate-mm-from-bottom': DEFAULT_MM_FROM_BOTTOM_ASPIRATE,
  'dispense-mm-from-bottom': DEFAULT_MM_FROM_BOTTOM_DISPENSE,
  'touch-tip-mm-from-top': DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP,
}

export const createFile: BaseState => PDProtocolFile = createSelector(
  getFileMetadata,
  getInitialRobotState,
  getRobotStateTimeline,
  dismissSelectors.getAllDismissedWarnings,
  ingredSelectors.getLiquidGroupsById,
  ingredSelectors.getLiquidsByLabwareId,
  stepFormSelectors.getSavedStepForms,
  stepFormSelectors.getOrderedStepIds,
  stepFormSelectors.getLabwareEntities,
  stepFormSelectors.getPipetteEntities,
  uiLabwareSelectors.getLabwareNicknamesById,
  (
    fileMetadata,
    initialRobotState,
    robotStateTimeline,
    dismissedWarnings,
    ingredients,
    ingredLocations,
    savedStepForms,
    orderedStepIds,
    labwareEntities,
    pipetteEntities,
    labwareNamesById
  ) => {
    const { author, description, created } = fileMetadata
    const name = fileMetadata['protocol-name'] || 'untitled'
    const lastModified = fileMetadata['last-modified']

    const pipettes = mapValues(
      initialRobotState.pipettes,
      (
        pipette: $Values<typeof initialRobotState.pipettes>,
        pipetteId: string
      ): FilePipette => ({
        mount: pipette.mount,
        // TODO: Ian 2018-11-06 'model' is for backwards compatibility with old API version
        // (JSON executor used to expect versioned model).
        // Drop this "model" when we do breaking change (see TODO in protocol-schema.json)
        model: pipetteEntities[pipetteId].name + '_v1.3',
        name: pipetteEntities[pipetteId].name,
      })
    )

    const labware = mapValues(
      initialRobotState.labware,
      (
        l: $Values<typeof initialRobotState.labware>,
        labwareId: string
      ): FileLabware => ({
        slot: l.slot,
        'display-name': labwareNamesById[labwareId],
        model: labwareEntities[labwareId].type,
      })
    )

    // TODO: Ian 2018-07-10 allow user to save steps in JSON file, even if those
    // step never have saved forms.
    // (We could just export the `steps` reducer, but we've sunset it)
    const savedOrderedStepIds = orderedStepIds.filter(
      stepId => savedStepForms[stepId]
    )

    return {
      'protocol-schema': protocolSchemaVersion,

      metadata: {
        'protocol-name': name,
        author,
        description,
        created,
        'last-modified': lastModified,

        // TODO LATER
        category: null,
        subcategory: null,
        tags: [],
      },

      'default-values': executionDefaults,

      'designer-application': {
        'application-name': 'opentrons/protocol-designer',
        'application-version': applicationVersion,
        applicationVersion,
        _internalAppBuildDate,
        data: {
          pipetteTiprackAssignments: mapValues(
            pipetteEntities,
            (p: $Values<typeof pipetteEntities>): ?string => p.tiprackModel
          ),
          dismissedWarnings,
          ingredients,
          ingredLocations,
          savedStepForms,
          orderedStepIds: savedOrderedStepIds,
        },
      },

      robot: {
        model: 'OT-2 Standard',
      },

      pipettes,
      labware,

      procedure: robotStateTimeline.timeline.map((timelineItem, i) => ({
        annotation: {
          name: `TODO Name ${i}`,
          description: 'todo description',
        },
        subprocedure: timelineItem.commands.reduce((acc, c) => [...acc, c], []),
      })),
    }
  }
)
