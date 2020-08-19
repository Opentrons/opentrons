// @flow
import { createSelector } from 'reselect'
import flatMap from 'lodash/flatMap'
import isEmpty from 'lodash/isEmpty'
import mapValues from 'lodash/mapValues'
import uniq from 'lodash/uniq'
import { getFileMetadata } from './fileFields'
import { getInitialRobotState, getRobotStateTimeline } from './commands'
import { selectors as dismissSelectors } from '../../dismiss'
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
} from '@opentrons/shared-data/protocol/flowTypes/schemaV4'
import type { Command } from '@opentrons/shared-data/protocol/flowTypes/schemaV6'
import type { ModuleEntity } from '../../step-forms'
import type { Selector } from '../../types'
import type { PDProtocolFile } from '../../file-types'
import type { Timeline } from '../../step-generation/types'

// TODO: BC: 2018-02-21 uncomment this assert, causes test failures
// assert(!isEmpty(process.env.OT_PD_VERSION), 'Could not find application version!')
if (isEmpty(process.env.OT_PD_VERSION))
  console.warn('Could not find application version!')
const applicationVersion: string = process.env.OT_PD_VERSION || ''

// Internal release date: this should never be read programatically,
// it just helps us humans quickly identify what build a user was using
// when we look at saved protocols (without requiring us to trace thru git logs)
const _internalAppBuildDate = process.env.OT_PD_BUILD_DATE

// NOTE: V3 commands are a subset of V4 commands.
const _isV3Command = (command: Command): boolean =>
  command.command === 'aspirate' ||
  command.command === 'dispense' ||
  command.command === 'airGap' ||
  command.command === 'blowout' ||
  command.command === 'touchTip' ||
  command.command === 'pickUpTip' ||
  command.command === 'dropTip' ||
  command.command === 'moveToSlot' ||
  command.command === 'delay'

// This is a HACK to allow PD to not have to export protocols under the not-yet-released
// v6 schema with the dispenseAirGap command, by replacing all dispenseAirGaps with dispenses
// Once we have v6 in the wild, just use the ordinary getRobotStateTimeline and
// delete this getRobotStateTimelineWithoutAirGapDispenseCommand.
export const getRobotStateTimelineWithoutAirGapDispenseCommand: Selector<Timeline> = createSelector(
  getRobotStateTimeline,
  robotStateTimeline => {
    const timeline = robotStateTimeline.timeline.map(frame => ({
      ...frame,
      commands: frame.commands.map(command => {
        if (command.command === 'dispenseAirGap') {
          return { ...command, command: 'dispense' }
        }
        return command
      }),
    }))
    return { ...robotStateTimeline, timeline }
  }
)

/** If there are any module entities or and v4-specific commands,
 ** export as a v4 protocol. Otherwise, export as v3.
 **
 ** NOTE: In real life, you shouldn't be able to have v4 atomic commands
 ** without having module entities b/c this will produce "no module for this step"
 ** form/timeline errors. Checking for v4 commands should be redundant,
 ** we do it just in case non-V3 commands somehow sneak in despite having no modules. */
export const getIsV4Protocol: Selector<boolean> = createSelector(
  getRobotStateTimelineWithoutAirGapDispenseCommand,
  stepFormSelectors.getModuleEntities,
  (robotStateTimeline, moduleEntities) => {
    const noModules = isEmpty(moduleEntities)
    const hasOnlyV3Commands = robotStateTimeline.timeline.every(timelineFrame =>
      timelineFrame.commands.every(command => _isV3Command(command))
    )
    const isV3 = noModules && hasOnlyV3Commands
    return !isV3
  }
)

// $FlowFixMe(IL, 2020-03-02): presence of non-v3 commands should make 'isV4Protocol' true
export const createFile: Selector<PDProtocolFile> = createSelector(
  getFileMetadata,
  getInitialRobotState,
  getRobotStateTimelineWithoutAirGapDispenseCommand,
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
  getIsV4Protocol,
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
    isV4Protocol
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
      (moduleEntity: ModuleEntity, moduleId: string): FileModule => ({
        slot: initialRobotState.modules[moduleId].slot,
        model: moduleEntity.model,
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

    const commands: Array<Command> = flatMap(
      robotStateTimeline.timeline,
      timelineFrame => timelineFrame.commands
    )

    const protocolFile = {
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
    }

    if (isV4Protocol) {
      return {
        ...protocolFile,
        $otSharedSchema: '#/protocol/schemas/4',
        schemaVersion: 4,
        modules,
        commands,
      }
    } else {
      return {
        ...protocolFile,
        schemaVersion: 3,
        commands,
      }
    }
  }
)
