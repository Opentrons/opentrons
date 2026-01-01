import {
  getLabwareDefinitionsByURIForProtocol,
  getModuleType,
  getPipetteSpecsV2,
} from '@opentrons/shared-data'

import { uuid } from '.'
import { GRIPPER_LOCATION } from '../constants'
import { createStagingAreaForInvariantContext } from './misc'

import type {
  PickUpTipRunTimeCommand,
  ProtocolAnalysisOutput,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type {
  InvariantContext,
  LabwareEntities,
  ModuleEntities,
  PipetteEntities,
  StagingAreaEntities,
  TrashBinEntities,
  WasteChuteEntities,
} from '../types'

export function constructInvariantContextFromAnalysis(
  analysis: ProtocolAnalysisOutput
): InvariantContext {
  const { labware, modules, pipettes, commands } = analysis
  const labwareDefinitions = getLabwareDefinitionsByURIForProtocol(commands)

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

  const pipetteEntities = pipettes.reduce<PipetteEntities>((acc, pipette) => {
    const { id, pipetteName } = pipette
    const spec = getPipetteSpecsV2(pipetteName)
    const tiprackIdsAssosciatedWithPipette = commands.filter(
      (command): command is PickUpTipRunTimeCommand =>
        command.commandType === 'pickUpTip' && command.params.pipetteId === id
    )
    const matchingLabwareEntities = tiprackIdsAssosciatedWithPipette.map(
      pickUpTipCommand => labwareEntities[pickUpTipCommand.params.labwareId]
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
        'labwareEntities' | 'moduleEntities' | 'pipetteEntities'
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
          ) &&
          addressableAreaName.includes('movableTrash')
        ) {
          trashBinEntities = {
            ...acc.trashBinEntities,
            [id]: {
              pythonName: 'trash_bin_1',
              id,
              location,
            },
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
      //  this util is used for the timeline scrubber. It grabs liquid info from analysis
      //  so this will not be wired up right now
      liquidEntities: {},
      config: { OT_PD_DISABLE_MODULE_RESTRICTIONS: true },
    }
  )
  return {
    labwareEntities,
    pipetteEntities,
    moduleEntities,
    ...otherEntities,
  }
}
