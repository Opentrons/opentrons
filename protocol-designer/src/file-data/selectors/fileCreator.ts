import { createSelector } from 'reselect'
import flatMap from 'lodash/flatMap'
import isEmpty from 'lodash/isEmpty'
import mapValues from 'lodash/mapValues'
import map from 'lodash/map'
import reduce from 'lodash/reduce'
import uniq from 'lodash/uniq'
import {
  FIXED_TRASH_ID,
  FLEX_ROBOT_TYPE,
  OT2_STANDARD_DECKID,
  OT2_STANDARD_MODEL,
  OT3_STANDARD_DECKID,
  SPAN7_8_10_11_SLOT,
} from '@opentrons/shared-data'
import { getFileMetadata, getRobotType } from './fileFields'
import { getInitialRobotState, getRobotStateTimeline } from './commands'
import { selectors as dismissSelectors } from '../../dismiss'
import {
  selectors as labwareDefSelectors,
  LabwareDefByDefURI,
} from '../../labware-defs'
import { uuid } from '../../utils'
import { selectors as ingredSelectors } from '../../labware-ingred/selectors'
import { selectors as stepFormSelectors } from '../../step-forms'
import { selectors as uiLabwareSelectors } from '../../ui/labware'
import { getLoadLiquidCommands } from '../../load-file/migration/utils/getLoadLiquidCommands'
import { swatchColors } from '../../components/swatchColors'
import {
  DEFAULT_MM_FROM_BOTTOM_ASPIRATE,
  DEFAULT_MM_FROM_BOTTOM_DISPENSE,
  DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP,
  DEFAULT_MM_BLOWOUT_OFFSET_FROM_TOP,
} from '../../constants'
import type {
  ModuleEntity,
  PipetteEntity,
  LabwareEntities,
  PipetteEntities,
  RobotState,
} from '@opentrons/step-generation'
import type {
  CreateCommand,
  ProtocolFile,
} from '@opentrons/shared-data/protocol/types/schemaV6'
import type { Selector } from '../../types'
import type {
  LoadLabwareCreateCommand,
  LoadModuleCreateCommand,
  LoadPipetteCreateCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'

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

export const createFile: Selector<ProtocolFile> = createSelector(
  getFileMetadata,
  getInitialRobotState,
  getRobotStateTimeline,
  getRobotType,
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
  (
    fileMetadata,
    initialRobotState,
    robotStateTimeline,
    robotType,
    dismissedWarnings,
    ingredients,
    ingredLocations,
    savedStepForms,
    orderedStepIds,
    labwareEntities,
    moduleEntities,
    pipetteEntities,
    labwareNicknamesById,
    labwareDefsByURI
  ) => {
    const { author, description, created } = fileMetadata
    const name = fileMetadata.protocolName || 'untitled'
    const lastModified = fileMetadata.lastModified
    // TODO: Ian 2018-07-10 allow user to save steps in JSON file, even if those
    // step never have saved forms.
    // (We could just export the `steps` reducer, but we've sunset it)
    const savedOrderedStepIds = orderedStepIds.filter(
      stepId => savedStepForms[stepId]
    )
    const designerApplication = {
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
    }

    const pipettes: ProtocolFile['pipettes'] = mapValues(
      initialRobotState.pipettes,
      (
        pipette: typeof initialRobotState.pipettes[keyof typeof initialRobotState.pipettes],
        pipetteId: string
      ) => ({
        name: pipetteEntities[pipetteId].name,
      })
    )

    const loadPipetteCommands = map(
      initialRobotState.pipettes,
      (
        pipette: typeof initialRobotState.pipettes[keyof typeof initialRobotState.pipettes],
        pipetteId: string
      ): LoadPipetteCreateCommand => {
        const loadPipetteCommand = {
          key: uuid(),
          commandType: 'loadPipette' as const,
          params: {
            pipetteId: pipetteId,
            mount: pipette.mount,
          },
        }
        return loadPipetteCommand
      }
    )

    const liquids: ProtocolFile['liquids'] = reduce(
      ingredients,
      (acc, liquidData, liquidId) => {
        return {
          ...acc,
          [liquidId]: {
            displayName: liquidData.name,
            description: liquidData.description ?? '',
            displayColor: liquidData.displayColor ?? swatchColors(liquidId),
          },
        }
      },
      {}
    )

    const labware: ProtocolFile['labware'] = mapValues(
      initialRobotState.labware,
      (
        l: typeof initialRobotState.labware[keyof typeof initialRobotState.labware],
        labwareId: string
      ) => ({
        displayName: labwareNicknamesById[labwareId],
        definitionId: labwareEntities[labwareId].labwareDefURI,
      })
    )

    const loadLabwareCommands = reduce<
      RobotState['labware'],
      LoadLabwareCreateCommand[]
    >(
      initialRobotState.labware,
      (
        acc,
        labware: typeof initialRobotState.labware[keyof typeof initialRobotState.labware],
        labwareId: string
      ): LoadLabwareCreateCommand[] => {
        if (labwareId === FIXED_TRASH_ID) return [...acc]
        const isLabwareOnTopOfModule = labware.slot in initialRobotState.modules
        const loadLabwareCommand = {
          key: uuid(),
          commandType: 'loadLabware' as const,
          params: {
            labwareId: labwareId,
            location: isLabwareOnTopOfModule
              ? { moduleId: labware.slot }
              : { slotName: labware.slot },
          },
        }
        return [...acc, loadLabwareCommand]
      },
      []
    )

    const loadLiquidCommands = getLoadLiquidCommands(
      ingredients,
      ingredLocations
    )
    const modules: ProtocolFile['modules'] = mapValues(
      moduleEntities,
      (moduleEntity: ModuleEntity, moduleId: string) => ({
        model: moduleEntity.model,
      })
    )

    const loadModuleCommands = map(
      initialRobotState.modules,
      (
        module: typeof initialRobotState.modules[keyof typeof initialRobotState.modules],
        moduleId: string
      ): LoadModuleCreateCommand => {
        const loadModuleCommand = {
          key: uuid(),
          commandType: 'loadModule' as const,
          params: {
            moduleId: moduleId,
            location: {
              slotName: module.slot === SPAN7_8_10_11_SLOT ? '7' : module.slot,
            },
          },
        }
        return loadModuleCommand
      }
    )

    const labwareDefinitions = getLabwareDefinitionsInUse(
      labwareEntities,
      pipetteEntities,
      labwareDefsByURI
    )
    const loadCommands: CreateCommand[] = [
      ...loadPipetteCommands,
      ...loadModuleCommands,
      ...loadLabwareCommands,
      ...loadLiquidCommands,
    ]

    const nonLoadCommands: CreateCommand[] = flatMap(
      robotStateTimeline.timeline,
      timelineFrame => timelineFrame.commands
    )

    const commands = [...loadCommands, ...nonLoadCommands]

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
      designerApplication,
      robot:
        robotType === FLEX_ROBOT_TYPE
          ? { model: FLEX_ROBOT_TYPE, deckId: OT3_STANDARD_DECKID }
          : { model: OT2_STANDARD_MODEL, deckId: OT2_STANDARD_DECKID },
      pipettes,
      labware,
      liquids,
      labwareDefinitions,
    }
    return {
      ...protocolFile,
      $otSharedSchema: '#/protocol/schemas/6',
      schemaVersion: 6,
      modules,
      commands,
    }
  }
)
