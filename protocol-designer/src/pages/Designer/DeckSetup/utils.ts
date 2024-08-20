import {
  FLEX_ROBOT_TYPE,
  FLEX_STAGING_AREA_SLOT_ADDRESSABLE_AREAS,
  MAGNETIC_BLOCK_V1,
  OT2_ROBOT_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V2,
  getModuleType,
} from '@opentrons/shared-data'
import { getOnlyLatestDefs } from '../../../labware-defs'
import {
  FLEX_MODULE_MODELS,
  OT2_MODULE_MODELS,
  RECOMMENDED_LABWARE_BY_MODULE,
} from './constants'

import type {
  AddressableAreaName,
  CutoutFixture,
  CutoutId,
  DeckSlotId,
  LabwareDefinition2,
  ModuleModel,
  RobotType,
} from '@opentrons/shared-data'

export function getCutoutIdForAddressableArea(
  addressableArea: AddressableAreaName,
  cutoutFixtures: CutoutFixture[]
): CutoutId | null {
  return cutoutFixtures.reduce<CutoutId | null>((acc, cutoutFixture) => {
    const [cutoutId] =
      Object.entries(
        cutoutFixture.providesAddressableAreas
      ).find(([_cutoutId, providedAAs]) =>
        providedAAs.includes(addressableArea)
      ) ?? []
    return (cutoutId as CutoutId) ?? acc
  }, null)
}

export function getModuleModelsBySlot(
  enableAbsorbanceReader: boolean,
  robotType: RobotType,
  slot: DeckSlotId
): ModuleModel[] {
  const FLEX_MIDDLE_SLOTS = ['B2', 'C2', 'A2', 'D2']
  const OT2_MIDDLE_SLOTS = ['2', '5', '8', '11']

  let moduleModels: ModuleModel[] = enableAbsorbanceReader
    ? FLEX_MODULE_MODELS.filter(model => model !== 'absorbanceReaderV1')
    : FLEX_MODULE_MODELS

  switch (robotType) {
    case FLEX_ROBOT_TYPE: {
      if (slot !== 'B1' && !FLEX_MIDDLE_SLOTS.includes(slot)) {
        moduleModels = FLEX_MODULE_MODELS.filter(
          model => model !== THERMOCYCLER_MODULE_V2
        )
      }
      if (FLEX_MIDDLE_SLOTS.includes(slot)) {
        moduleModels = FLEX_MODULE_MODELS.filter(
          model => model === MAGNETIC_BLOCK_V1
        )
      }
      if (
        FLEX_STAGING_AREA_SLOT_ADDRESSABLE_AREAS.includes(
          slot as AddressableAreaName
        )
      ) {
        moduleModels = []
      }
      break
    }
    case OT2_ROBOT_TYPE: {
      if (OT2_MIDDLE_SLOTS.includes(slot)) {
        moduleModels = []
      } else if (slot !== '7') {
        moduleModels = OT2_MODULE_MODELS.filter(
          model => getModuleType(model) !== THERMOCYCLER_MODULE_TYPE
        )
      } else {
        moduleModels = OT2_MODULE_MODELS
      }
      break
    }
  }
  return moduleModels
}

export const getLabwareIsRecommended = (
  def: LabwareDefinition2,
  moduleModel?: ModuleModel | null
): boolean => {
  //  special-casing the thermocycler module V2 recommended labware since the thermocyclerModuleTypes
  //  have different recommended labware
  const moduleType = moduleModel != null ? getModuleType(moduleModel) : null
  if (moduleModel === THERMOCYCLER_MODULE_V2) {
    return (
      def.parameters.loadName === 'opentrons_96_wellplate_200ul_pcr_full_skirt'
    )
  } else {
    return moduleType != null
      ? RECOMMENDED_LABWARE_BY_MODULE[moduleType].includes(
          def.parameters.loadName
        )
      : false
  }
}

export const getLabwareCompatibleWithAdapter = (
  adapterLoadName?: string
): string[] => {
  const defs = getOnlyLatestDefs()

  if (adapterLoadName == null) {
    return []
  }

  return Object.entries(defs)
    .filter(
      ([, { stackingOffsetWithLabware }]) =>
        stackingOffsetWithLabware?.[adapterLoadName] != null
    )
    .map(([labwareDefUri]) => labwareDefUri)
}
