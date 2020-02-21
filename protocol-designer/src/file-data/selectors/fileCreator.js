// @flow
import { createSelector } from 'reselect'
import flatten from 'lodash/flatten'
import isEmpty from 'lodash/isEmpty'
import mapValues from 'lodash/mapValues'
import uniq from 'lodash/uniq'
import { getFileMetadata } from './fileFields'
import { getInitialRobotState, getRobotStateTimeline } from './commands'
import { selectors as dismissSelectors } from '../../dismiss'
import { selectors as featureFlagSelectors } from '../../feature-flags'
import { selectors as labwareDefSelectors } from '../../labware-defs'
import { selectors as ingredSelectors } from '../../labware-ingred/selectors'
import { selectors as stepFormSelectors } from '../../step-forms'
import { selectors as uiLabwareSelectors } from '../../ui/labware'
import {
  DEFAULT_MM_FROM_BOTTOM_ASPIRATE,
  DEFAULT_MM_FROM_BOTTOM_DISPENSE,
  DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP,
  DEFAULT_MM_BLOWOUT_OFFSET_FROM_TOP,
} from '../../constants'

import type {
  FilePipette,
  FileLabware,
  FileModule,
  Command,
} from '@opentrons/shared-data/protocol/flowTypes/schemaV4'
import type { ModuleEntity } from '../../step-forms'
import type { BaseState } from '../../types'
import type { PDProtocolFile } from '../../file-types'

// TODO: Ian 2019-11-11 remove the `any` and bump to 4 when v4 is released
const protocolSchemaVersion: any = 3

// TODO: BC: 2018-02-21 uncomment this assert, causes test failures
// assert(!isEmpty(process.env.OT_PD_VERSION), 'Could not find application version!')
if (isEmpty(process.env.OT_PD_VERSION))
  console.warn('Could not find application version!')
const applicationVersion: string = process.env.OT_PD_VERSION || ''

// Internal release date: this should never be read programatically,
// it just helps us humans quickly identify what build a user was using
// when we look at saved protocols (without requiring us to trace thru git logs)
const _internalAppBuildDate = process.env.OT_PD_BUILD_DATE

// $FlowFixMe(mc, 2020-02-21): Error from Flow 0.118 upgrade
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
  stepFormSelectors.getModuleEntities,
  stepFormSelectors.getPipetteEntities,
  uiLabwareSelectors.getLabwareNicknamesById,
  labwareDefSelectors.getLabwareDefsByURI,
  featureFlagSelectors.getEnableModules,
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
    moduleEntities,
    pipetteEntities,
    labwareNicknamesById,
    labwareDefsByURI,
    modulesEnabled
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
        name: pipetteEntities[pipetteId].name,
      })
    )

    const labware: { [labwareId: string]: FileLabware } = mapValues(
      initialRobotState.labware,
      (
        l: $Values<typeof initialRobotState.labware>,
        labwareId: string
      ): FileLabware => ({
        slot: l.slot,
        displayName: labwareNicknamesById[labwareId],
        definitionId: labwareEntities[labwareId].labwareDefURI,
      })
    )

    const modules: { [moduleId: string]: FileModule } = mapValues(
      moduleEntities,
      (module: ModuleEntity, moduleId: string): FileModule => ({
        slot: initialRobotState.modules[moduleId].slot,
        model: module.model,
      })
    )

    // TODO: Ian 2018-07-10 allow user to save steps in JSON file, even if those
    // step never have saved forms.
    // (We could just export the `steps` reducer, but we've sunset it)
    const savedOrderedStepIds = orderedStepIds.filter(
      stepId => savedStepForms[stepId]
    )

    // exclude definitions that aren't used by any labware in the protocol
    const labwareDefsInUse = uniq(
      Object.keys(labware).map(
        (labwareId: string) => labware[labwareId].definitionId
      )
    )
    const labwareDefinitions = labwareDefsInUse.reduce<typeof labwareDefsByURI>(
      (acc, labwareDefURI: string) => ({
        ...acc,
        [labwareDefURI]: labwareDefsByURI[labwareDefURI],
      }),
      {}
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
            // TODO: Ian 2019-06-13 load these into redux and always get them from redux, not constants.js
            // This `defaultValues` key is not yet read by anything, but is populated here for auditability
            // and so that later we can do #3587 without a PD migration
            aspirate_mmFromBottom: DEFAULT_MM_FROM_BOTTOM_ASPIRATE,
            dispense_mmFromBottom: DEFAULT_MM_FROM_BOTTOM_DISPENSE,
            touchTip_mmFromTop: DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP,
            blowout_mmFromTop: DEFAULT_MM_BLOWOUT_OFFSET_FROM_TOP,
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
      labwareDefinitions,

      commands: flatten<Command, Command>(
        robotStateTimeline.timeline.map(timelineFrame => timelineFrame.commands)
      ),

      ...(modulesEnabled ? { modules } : {}),
    }
  }
)
