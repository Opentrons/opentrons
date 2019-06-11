// @flow
import { createSelector } from 'reselect'
import flatten from 'lodash/flatten'
import isEmpty from 'lodash/isEmpty'
import mapValues from 'lodash/mapValues'
import { getFileMetadata } from './fileFields'
import { getInitialRobotState, getRobotStateTimeline } from './commands'
import { selectors as dismissSelectors } from '../../dismiss'
import { selectors as ingredSelectors } from '../../labware-ingred/selectors'
import { selectors as stepFormSelectors } from '../../step-forms'
import { selectors as uiLabwareSelectors } from '../../ui/labware'

import type {
  FilePipetteV3 as FilePipette,
  FileLabwareV3 as FileLabware,
  CommandV3,
} from '@opentrons/shared-data'
import type { BaseState } from '../../types'
import type { PDProtocolFile } from '../../file-types'

const protocolSchemaVersion = 3

// TODO: BC: 2018-02-21 uncomment this assert, causes test failures
// assert(!isEmpty(process.env.OT_PD_VERSION), 'Could not find application version!')
if (isEmpty(process.env.OT_PD_VERSION))
  console.warn('Could not find application version!')
const applicationVersion: string = process.env.OT_PD_VERSION || ''

// Internal release date: this should never be read programatically,
// it just helps us humans quickly identify what build a user was using
// when we look at saved protocols (without requiring us to trace thru git logs)
const _internalAppBuildDate = process.env.OT_PD_BUILD_DATE

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
    const name = fileMetadata.protocolName || 'untitled'
    const lastModified = fileMetadata.lastModified

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
        labwareDefURI: labwareEntities[labwareId].labwareDefURI,
      })
    )

    // TODO: Ian 2018-07-10 allow user to save steps in JSON file, even if those
    // step never have saved forms.
    // (We could just export the `steps` reducer, but we've sunset it)
    const savedOrderedStepIds = orderedStepIds.filter(
      stepId => savedStepForms[stepId]
    )

    return {
      schemaVersion: protocolSchemaVersion,

      metadata: {
        protocolName: name,
        author,
        description,
        created,
        lastModified,

        // TODO LATER
        category: null,
        subcategory: null,
        tags: [],
      },

      designerApplication: {
        name: 'opentrons/protocol-designer',
        version: applicationVersion,
        data: {
          _internalAppBuildDate,
          defaultValues: {
            // TODO IMMEDIATELY
          },
          pipetteTiprackAssignments: mapValues(
            pipetteEntities,
            (p: $Values<typeof pipetteEntities>): ?string => p.tiprackDefURI
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
      labwareDefinitions: {}, // TODO IMMEDIATELY

      commands: flatten<CommandV3, CommandV3>(
        robotStateTimeline.timeline.map(timelineFrame => timelineFrame.commands)
      ),
    }
  }
)
