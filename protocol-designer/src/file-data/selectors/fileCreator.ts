import { createSelector } from 'reselect'
import flatMap from 'lodash/flatMap'
import isEmpty from 'lodash/isEmpty'
import mapValues from 'lodash/mapValues'
import uniq from 'lodash/uniq'
import { getFileMetadata } from './fileFields'
import { getInitialRobotState, getRobotStateTimeline } from './commands'
import { selectors as dismissSelectors } from '../../dismiss'
import {
  selectors as labwareDefSelectors,
  LabwareDefByDefURI,
} from '../../labware-defs'
import { selectors as ingredSelectors } from '../../labware-ingred/selectors'
import { selectors as stepFormSelectors } from '../../step-forms'
import { selectors as uiLabwareSelectors } from '../../ui/labware'
import {
  DEFAULT_MM_FROM_BOTTOM_ASPIRATE,
  DEFAULT_MM_FROM_BOTTOM_DISPENSE,
  DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP,
  DEFAULT_MM_BLOWOUT_OFFSET_FROM_TOP,
} from '../../constants'
import {
  ModuleEntity,
  PipetteEntity,
  LabwareEntities,
  PipetteEntities,
  Timeline,
} from '@opentrons/step-generation'
import {
  FilePipette,
  FileLabware,
  FileModule,
} from '@opentrons/shared-data/protocol/types/schemaV4'
import { Command } from '@opentrons/shared-data/protocol/types/schemaV6'
import { Selector } from '../../types'
import { PDProtocolFile } from '../../file-types'
// TODO: BC: 2018-02-21 uncomment this assert, causes test failures
// assert(!isEmpty(process.env.OT_PD_VERSION), 'Could not find application version!')
if (isEmpty(process.env.OT_PD_VERSION))
  console.warn('Could not find application version!')
const applicationVersion: string = process.env.OT_PD_VERSION || ''
// Internal release date: this should never be read programatically,
// it just helps us humans quickly identify what build a user was using
// when we look at saved protocols (without requiring us to trace thru git logs)
const _internalAppBuildDate = process.env.OT_PD_BUILD_DATE
// A labware definition is considered "in use" and should be included in
// the protocol file if it either...
// 1. is present on the deck in initial deck setup
// 2. OR is a tiprack def assigned to a pipette, even if it's not on the deck
export const getLabwareDefinitionsInUse = (
  labware: LabwareEntities,
  pipettes: PipetteEntities,
  allLabwareDefsByURI: LabwareDefByDefURI
): LabwareDefByDefURI => {
  const labwareDefURIsOnDeck: string[] = Object.keys(labware).map(
    (labwareId: string) => labware[labwareId].labwareDefURI
  )
  const tiprackDefURIsInUse: string[] = Object.keys(pipettes)
    .map(id => pipettes[id])
    .map((pipetteEntity: PipetteEntity) => pipetteEntity.tiprackDefURI)
  const labwareDefURIsInUse = uniq([
    ...tiprackDefURIsInUse,
    ...labwareDefURIsOnDeck,
  ])
  return labwareDefURIsInUse.reduce<LabwareDefByDefURI>(
    (acc, labwareDefURI: string) => ({
      ...acc,
      [labwareDefURI]: allLabwareDefsByURI[labwareDefURI],
    }),
    {}
  )
}

// NOTE: V3 commands are a subset of V4 commands.
// 'airGap' is specified in the V3 schema but was never implemented, so it doesn't count.
const _isV3Command = (command: Command): boolean =>
  command.command === 'aspirate' ||
  command.command === 'dispense' ||
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
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          return { ...command, command: 'dispense' } as Command
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
export const getRequiresAtLeastV4: Selector<boolean> = createSelector(
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

// Note: though airGap is supported in the v4 executor, we want to simplify things
// for users in terms of managing robot stack upgrades, so we will force v5
const _requiresV5 = (command: Command): boolean =>
  command.command === 'moveToWell' || command.command === 'airGap'

export const getRequiresAtLeastV5: Selector<boolean> = createSelector(
  getRobotStateTimelineWithoutAirGapDispenseCommand,
  robotStateTimeline => {
    return robotStateTimeline.timeline.some(timelineFrame =>
      timelineFrame.commands.some(command => _requiresV5(command))
    )
  }
)
export const getExportedFileSchemaVersion: Selector<number> = createSelector(
  getRequiresAtLeastV4,
  getRequiresAtLeastV5,
  (requiresV4, requiresV5) => {
    if (requiresV5) {
      return 5
    } else if (requiresV4) {
      return 4
    } else {
      return 3
    }
  }
)
// @ts-expect-error(IL, 2020-03-02): presence of non-v3 commands should make 'isV4Protocol' true
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
  getRequiresAtLeastV4,
  getRequiresAtLeastV5,
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
    requiresAtLeastV4Protocol,
    requiresAtLeastV5Protocol
  ) => {
    const { author, description, created } = fileMetadata
    const name = fileMetadata.protocolName || 'untitled'
    const lastModified = fileMetadata.lastModified
    const pipettes = mapValues(
      initialRobotState.pipettes,
      (
        pipette: typeof initialRobotState.pipettes[keyof typeof initialRobotState.pipettes],
        pipetteId: string
      ): FilePipette => ({
        mount: pipette.mount,
        name: pipetteEntities[pipetteId].name,
      })
    )
    const labware: Record<string, FileLabware> = mapValues(
      initialRobotState.labware,
      (
        l: typeof initialRobotState.labware[keyof typeof initialRobotState.labware],
        labwareId: string
      ): FileLabware => ({
        slot: l.slot,
        displayName: labwareNicknamesById[labwareId],
        definitionId: labwareEntities[labwareId].labwareDefURI,
      })
    )
    const modules: Record<string, FileModule> = mapValues(
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
    const labwareDefinitions = getLabwareDefinitionsInUse(
      labwareEntities,
      pipetteEntities,
      labwareDefsByURI
    )
    const commands: Command[] = flatMap(
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
            (
              p: typeof pipetteEntities[keyof typeof pipetteEntities]
            ): string | null | undefined => p.tiprackDefURI
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

    if (requiresAtLeastV5Protocol) {
      return {
        ...protocolFile,
        $otSharedSchema: '#/protocol/schemas/5',
        schemaVersion: 5,
        modules,
        commands,
      }
    } else if (requiresAtLeastV4Protocol) {
      return {
        ...protocolFile,
        $otSharedSchema: '#/protocol/schemas/4',
        schemaVersion: 4,
        modules,
        commands,
      }
    } else {
      return { ...protocolFile, schemaVersion: 3, commands }
    }
  }
)
