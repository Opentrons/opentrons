import map from 'lodash/map'
import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'

import {
  COLUMN_4_SLOTS,
  getSlotInLocationStack,
  uuid,
} from '@opentrons/step-generation'

import { getLoadLiquidCommands } from '../../load-file/migration/utils/getLoadLiquidCommands'

import type {
  AddressableAreaName,
  CreateCommand,
  LabwareLocation,
  LoadLabwareCreateCommand,
  LoadModuleCreateCommand,
  LoadPipetteCreateCommand,
  PipetteName,
} from '@opentrons/shared-data'
import type {
  LabwareEntities,
  LabwareEntity,
  LabwareLiquidState,
  LiquidEntities,
  ModuleEntities,
  ModuleEntity,
  PipetteEntities,
  PipetteEntity,
  RobotState,
  TimelineFrame,
} from '@opentrons/step-generation'
import type { Labware, Modules, Pipettes } from '../../file-types'

interface MappedPipettes {
  [pipetteId: string]: { name: PipetteName }
}

export const getLoadCommands = (
  initialRobotState: TimelineFrame,
  pipetteEntities: PipetteEntities,
  moduleEntities: ModuleEntities,
  labwareEntities: LabwareEntities,
  labwareNicknamesById: Record<string, string>,
  liquidEntities: LiquidEntities,
  ingredLocations: LabwareLiquidState
): CreateCommand[] => {
  const pipettes: MappedPipettes = mapValues(
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
          pipetteName: pipettes[pipetteId].name,
          mount: pipette.mount,
          pipetteId: pipetteId,
        },
      }
      return loadPipetteCommand
    }
  )

  // initiate "adapter" commands first so we can map through them to get the
  //  labware that goes on top of it's location
  const loadAdapterCommands = reduce<
    RobotState['labware'],
    LoadLabwareCreateCommand[]
  >(
    initialRobotState.labware,
    (
      acc,
      labware: typeof initialRobotState.labware[keyof typeof initialRobotState.labware],
      labwareId: string
    ): LoadLabwareCreateCommand[] => {
      const { def } = labwareEntities[labwareId]
      const isAdapter = def.allowedRoles?.includes('adapter')
      if (!isAdapter) {
        return acc
      }
      const locationUnderLabware = labware.stack[1]
      const isOnTopOfModule = moduleEntities[locationUnderLabware] != null
      const { namespace, parameters, version, metadata } = def
      const loadName = parameters.loadName
      const loadAdapterCommands = {
        key: uuid(),
        commandType: 'loadLabware' as const,
        params: {
          displayName: metadata.displayName,
          labwareId,
          loadName,
          namespace,
          version,
          location: isOnTopOfModule
            ? { moduleId: labware.stack[1] }
            : { slotName: labware.stack[1] },
        },
      }

      return [...acc, loadAdapterCommands]
    },
    []
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
      const { def } = labwareEntities[labwareId]
      const isAdapter = def.allowedRoles?.includes('adapter')
      if (isAdapter || def.metadata.displayCategory === 'trash') {
        return acc
      }
      const locationUnderLabware = labware.stack[1]
      const { namespace, parameters, version } = def
      const loadName = parameters.loadName

      const isAddressableAreaName = COLUMN_4_SLOTS.includes(
        getSlotInLocationStack(labware.stack)
      )

      let location: LabwareLocation = {
        slotName: getSlotInLocationStack(labware.stack),
      }
      if (moduleEntities[locationUnderLabware] != null) {
        location = { moduleId: moduleEntities[locationUnderLabware].id }
      } else if (labwareEntities[locationUnderLabware] != null) {
        location = { labwareId: labwareEntities[locationUnderLabware].id }
      } else if (isAddressableAreaName) {
        // TODO(bh, 2024-01-02): check slots against addressable areas via the deck definition
        location = {
          addressableAreaName: labware.stack[1] as AddressableAreaName,
        }
      } else if (getSlotInLocationStack(labware.stack) === 'offDeck') {
        location = 'offDeck'
      }

      const loadLabwareCommands = {
        key: uuid(),
        commandType: 'loadLabware' as const,
        params: {
          displayName:
            labwareNicknamesById[labwareId] ?? def.metadata.displayName,
          labwareId: labwareId,
          loadName,
          namespace: namespace,
          version: version,
          location,
        },
      }
      return [...acc, loadLabwareCommands]
    },
    []
  )

  const loadLiquidCommands = getLoadLiquidCommands(
    liquidEntities,
    ingredLocations
  )

  const loadModuleCommands = map(
    initialRobotState.modules,
    (
      module: typeof initialRobotState.modules[keyof typeof initialRobotState.modules],
      moduleId: string
    ): LoadModuleCreateCommand => {
      const model = moduleEntities[moduleId].model
      const loadModuleCommand = {
        key: uuid(),
        commandType: 'loadModule' as const,
        params: {
          model: model,
          location: {
            slotName: module.slot,
          },
          moduleId: moduleId,
        },
      }
      return loadModuleCommand
    }
  )

  return [
    ...loadPipetteCommands,
    ...loadModuleCommands,
    ...loadAdapterCommands,
    ...loadLabwareCommands,
    ...loadLiquidCommands,
  ]
}

export const getPipettesLoadInfo = (
  pipetteEntities: PipetteEntities
): Pipettes => {
  return Object.values(pipetteEntities).reduce<Pipettes>(
    (acc, pipetteEntity: PipetteEntity) => ({
      ...acc,
      [pipetteEntity.id]: { pipetteName: pipetteEntity.name },
    }),
    {}
  )
}

export const getModulesLoadInfo = (moduleEntities: ModuleEntities): Modules => {
  return Object.values(moduleEntities).reduce<Modules>(
    (acc, moduleEntity: ModuleEntity) => ({
      ...acc,
      [moduleEntity.id]: { model: moduleEntity.model },
    }),
    {}
  )
}

export const getLabwareLoadInfo = (
  labwareEntities: LabwareEntities,
  labwareNicknamesById: Record<string, string>
): Labware => {
  return Object.values(labwareEntities).reduce<Labware>(
    (acc, labwareEntity: LabwareEntity) => ({
      ...acc,
      [labwareEntity.id]: {
        displayName: labwareNicknamesById[labwareEntity.id],
        labwareDefURI: labwareEntity.labwareDefURI,
      },
    }),
    {}
  )
}
