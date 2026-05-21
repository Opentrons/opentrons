import {
  getLabwareDefinitionsByURIForProtocol,
  getLabwareDefURI,
  getModuleType,
  getPipetteSpecsV2,
} from '@opentrons/shared-data'

import { uuid } from '.'
import { GRIPPER_LOCATION } from '../constants'
import { createStagingAreaForInvariantContext } from './misc'

import type {
  CompletedProtocolAnalysis,
  PickUpTipRunTimeCommand,
  ProtocolAnalysisOutput,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type {
  InvariantContext,
  LabwareEntities,
  LiquidEntities,
  ModuleEntities,
  PipetteEntities,
  StagingAreaEntities,
  TrashBinEntities,
  WasteChuteEntities,
} from '../types'

// PD 8.4.3 introduced airGapInPlace which was released sometime on March 18, 2025, so any
// PD versions prior to that, we will not show the liquid state - this is a gross
// way to calculate which PD version it was but idk how else to do so since we don't
// have explicit access to the PD version in the analysis?
const PD_CUT_OFF_FOR_LIQUID_STATE_TRACKING = new Date('2025-03-19T00:00:00Z')

// API v2.22 is when airGapInPlace was introduced, so any API versions lower than
// that, we will not support showing the liquid state
const API_MAJOR_VERSION_AIR_GAP_IN_PLACE_STARTED_SUPPORTING = 2
const API_MINOR_VERSION_AIR_GAP_IN_PLACE_STARTED_SUPPORTING = 22

export function constructInvariantContextFromAnalysis(
  analysis: ProtocolAnalysisOutput | CompletedProtocolAnalysis,
  config: ProtocolAnalysisOutput['config'],
  createdDate: Date
): InvariantContext {
  const { labware, modules, pipettes, commands, liquids } = analysis
  const apiVersion = config.protocolType === 'python' ? config.apiVersion : null
  const isSupportingLiquidsPython =
    apiVersion != null &&
    apiVersion[0] >= API_MAJOR_VERSION_AIR_GAP_IN_PLACE_STARTED_SUPPORTING &&
    apiVersion[1] >= API_MINOR_VERSION_AIR_GAP_IN_PLACE_STARTED_SUPPORTING
  const isSupportingLiquidsPD =
    config.protocolType === 'json' &&
    createdDate >= PD_CUT_OFF_FOR_LIQUID_STATE_TRACKING

  const labwareDefinitions = getLabwareDefinitionsByURIForProtocol(commands)

  const liquidEntities = liquids.reduce<LiquidEntities>((acc, liquid) => {
    const { id, description, displayName, displayColor } = liquid

    return {
      ...acc,
      [id]: {
        description,
        displayName: displayName ?? 'Unknown Liquid',
        pythonName: 'n/a',
        displayColor: displayColor ?? '#B7B8B9', // this is COLORS.grey40 which step-generation doesn't have access to
        liquidGroupId: id,
      },
    }
  }, {})

  const moduleEntities = modules.reduce<ModuleEntities>((acc, module) => {
    const { id, model } = module

    return {
      ...acc,
      [id]: {
        id,
        type: getModuleType(model),
        model,
        pythonName: 'n/a',
      },
    }
  }, {})

  const labwareEntities = labware.reduce<LabwareEntities>(
    (acc, loadedLabware) => {
      const { id, definitionUri } = loadedLabware
      const def = labwareDefinitions[definitionUri]
      if (def == null) {
        return acc
      }
      if (def.schemaVersion === 3) {
        return acc
      }
      return {
        ...acc,
        [id]: {
          id,
          labwareDefURI: definitionUri,
          def,
          pythonName: 'n/a',
        },
      }
    },
    {}
  )
  const labwareEntitiesWithLidStacks = commands.reduce<LabwareEntities>(
    (acc, command) => {
      if (command.commandType === 'loadLidStack' && command.result != null) {
        const { stackLabwareId, lidStackDefinition } = command.result
        if (
          stackLabwareId != null &&
          lidStackDefinition != null &&
          acc[stackLabwareId] == null &&
          lidStackDefinition.schemaVersion !== 3
        ) {
          return {
            ...acc,
            [stackLabwareId]: {
              id: stackLabwareId,
              labwareDefURI: getLabwareDefURI(lidStackDefinition),
              def: lidStackDefinition,
              pythonName: 'n/a',
            },
          }
        }
      }
      return acc
    },
    labwareEntities
  )

  const pipetteEntities = pipettes.reduce<PipetteEntities>((acc, pipette) => {
    const { id, pipetteName } = pipette
    const spec = getPipetteSpecsV2(pipetteName)
    const tiprackIdsAssosciatedWithPipette = commands.filter(
      (command): command is PickUpTipRunTimeCommand =>
        command.commandType === 'pickUpTip' && command.params.pipetteId === id
    )
    const matchingLabwareEntities = tiprackIdsAssosciatedWithPipette.map(
      pickUpTipCommand =>
        labwareEntitiesWithLidStacks[pickUpTipCommand.params.labwareId]
    )
    const tiprackDefURIs = Array.from(
      new Set(matchingLabwareEntities.map(entity => entity.labwareDefURI))
    )
    const tiprackLabwareDefs = Array.from(
      new Set(matchingLabwareEntities.map(entity => entity.def))
    )
    if (spec == null) {
      return acc
    }

    acc[id] = {
      name: pipetteName,
      id,
      tiprackLabwareDef: tiprackLabwareDefs,
      tiprackDefURI: tiprackDefURIs,
      spec,
      pythonName: 'n/a',
    }

    return acc
  }, {})

  const otherEntities = commands.reduce(
    (
      acc: Omit<
        InvariantContext,
        | 'labwareEntities'
        | 'moduleEntities'
        | 'pipetteEntities'
        | 'liquidEntities'
      >,
      command: RunTimeCommand
    ) => {
      if (command.commandType === 'loadLidStack' && command.result != null) {
        const { params } = command
        const newStagingAreaEntities: StagingAreaEntities =
          createStagingAreaForInvariantContext(params)

        return {
          ...acc,
          stagingAreaEntities: {
            ...acc.stagingAreaEntities,
            ...newStagingAreaEntities,
          },
        }
      } else if (
        (command.commandType === 'loadLabware' ||
          command.commandType === 'loadLid') &&
        command.result != null
      ) {
        const { params } = command

        const newStagingAreaEntities: StagingAreaEntities =
          createStagingAreaForInvariantContext(params)

        return {
          ...acc,
          stagingAreaEntities: {
            ...acc.stagingAreaEntities,
            ...newStagingAreaEntities,
          },
        }
      } else if (
        command.commandType === 'moveToAddressableArea' ||
        command.commandType === 'moveToAddressableAreaForDropTip'
      ) {
        const addressableAreaName = command.params.addressableAreaName
        const id = `${uuid()}:${addressableAreaName}`
        let location: string = GRIPPER_LOCATION
        if (addressableAreaName === 'fixedTrash') {
          location = 'cutout12'
        } else if (addressableAreaName.includes('WasteChute')) {
          location = 'cutoutD3'
        } else if (addressableAreaName.includes('movableTrash')) {
          location = `cutout${addressableAreaName.split('movableTrash')[1]}`
        }
        let trashBinEntities: TrashBinEntities = acc.trashBinEntities
        if (
          !Object.values(acc.trashBinEntities).some(
            entity => entity.location === location
          )
        ) {
          if (addressableAreaName.includes('movableTrash')) {
            trashBinEntities = {
              ...acc.trashBinEntities,
              [id]: {
                pythonName: 'trash_bin_1',
                id,
                location,
              },
            }
          } else if (addressableAreaName === 'fixedTrash') {
            trashBinEntities = {
              ...acc.trashBinEntities,
              [id]: {
                pythonName: 'trash_bin_1',
                id,
                location,
              },
            }
          }
        }
        let wasteChuteEntities: WasteChuteEntities = acc.wasteChuteEntities
        if (addressableAreaName.includes('WasteChute')) {
          wasteChuteEntities = {
            [id]: {
              pythonName: 'waste_chute',
              id,
              location,
            },
          }
        }
        return {
          ...acc,
          trashBinEntities,
          wasteChuteEntities,
        }
      }

      return acc
    },
    {
      wasteChuteEntities: {},
      trashBinEntities: {},
      stagingAreaEntities: {},
      //  the timeline scrubber doesn't visualize gripper right now
      gripperEntities: {},
      config: { OT_PD_DISABLE_MODULE_RESTRICTIONS: true },
    }
  )
  return {
    labwareEntities: labwareEntitiesWithLidStacks,
    pipetteEntities,
    moduleEntities,
    liquidEntities:
      isSupportingLiquidsPython || isSupportingLiquidsPD ? liquidEntities : {},
    ...otherEntities,
  }
}
