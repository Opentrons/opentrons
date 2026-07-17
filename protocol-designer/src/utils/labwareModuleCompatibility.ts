// PD-specific info about labware<>module compatibilty
import {
  ABSORBANCE_READER_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_BLOCK_TYPE,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  VACUUM_MODULE_TYPE,
} from '@opentrons/shared-data'

import { VACUUM_MODULE_TYPE_WITH_LABWARE } from '../constants'
import { RECOMMENDED_LABWARE_BY_MODULE } from '../pages/Designer/DeckSetup/constants'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { LabwareDefByDefURI } from '../labware-defs'
import type { LabwareOnDeck } from '../step-forms'
import type { ModuleLabwareCompatibilityKey } from '../types'

// NOTE: this does not distinguish btw versions. Standard labware only (assumes namespace is 'opentrons')

const PLATE_READER_MAX_LABWARE_Z_MM = 16

export const COMPATIBLE_LABWARE_ALLOWLIST_BY_MODULE_TYPE: Record<
  ModuleLabwareCompatibilityKey,
  Readonly<string[]>
> = {
  [TEMPERATURE_MODULE_TYPE]: [
    'eppendorf_6_wellplate_16.8ml_flat',
    'agilent_24_wellplate_10ml_flat',
    'corning_6_wellplate_16.8ml_flat',
    'corning_12_wellplate_6.9ml_flat',
    'corning_24_wellplate_3.4ml_flat',
    'corning_48_wellplate_1.6ml_flat',
    'corning_96_wellplate_360ul_flat',
    'corning_384_wellplate_112ul_flat',
    'biorad_96_wellplate_200ul_pcr',
    'opentrons_24_aluminumblock_generic_2ml_screwcap',
    'opentrons_96_aluminumblock_generic_pcr_strip_200ul',
    'usascientific_12_reservoir_22ml', // 'biotix_1_well_reservoir_?ml', // TODO: Ian 2019-10-29 this is in the doc but doesn't exist
    'usascientific_96_wellplate_2.4ml_deep',
    'agilent_1_reservoir_290ml',
    'axygen_1_reservoir_90ml',
    'nest_96_wellplate_100ul_pcr_full_skirt',
    'nest_96_wellplate_200ul_flat',
    'opentrons_24_aluminumblock_nest_1.5ml_screwcap',
    'opentrons_24_aluminumblock_nest_1.5ml_snapcap',
    'opentrons_24_aluminumblock_nest_2ml_screwcap',
    'opentrons_24_aluminumblock_nest_2ml_snapcap',
    'opentrons_24_aluminumblock_nest_0.5ml_screwcap',
    'opentrons_96_well_aluminum_block',
    'opentrons_aluminum_flat_bottom_plate',
    'opentrons_96_deep_well_temp_mod_adapter',
  ],
  [MAGNETIC_MODULE_TYPE]: [
    'biorad_96_wellplate_200ul_pcr',
    'usascientific_96_wellplate_2.4ml_deep',
    'nest_96_wellplate_100ul_pcr_full_skirt',
    'nest_96_wellplate_2ml_deep',
    'opentrons_96_wellplate_200ul_pcr_full_skirt',
  ],
  [THERMOCYCLER_MODULE_TYPE]: [
    'biorad_96_wellplate_200ul_pcr',
    'nest_96_wellplate_100ul_pcr_full_skirt',
    'opentrons_96_wellplate_200ul_pcr_full_skirt',
  ],
  [HEATERSHAKER_MODULE_TYPE]: [
    'opentrons_96_deep_well_adapter',
    'opentrons_96_flat_bottom_adapter',
    'opentrons_96_pcr_adapter',
    'opentrons_universal_flat_adapter',
    'opentrons_universal_flat_adapter_type_b',
  ],
  [MAGNETIC_BLOCK_TYPE]: [
    'nest_96_wellplate_100ul_pcr_full_skirt',
    'nest_96_wellplate_2ml_deep',
    'opentrons_96_wellplate_200ul_pcr_full_skirt',
    'armadillo_96_wellplate_200ul_pcr_full_skirt',
    'biorad_96_wellplate_200ul_pcr',
  ],
  [ABSORBANCE_READER_TYPE]: [
    'opentrons_flex_lid_absorbance_plate_reader_module',
  ],
  [FLEX_STACKER_MODULE_TYPE]: [
    ...RECOMMENDED_LABWARE_BY_MODULE[FLEX_STACKER_MODULE_TYPE],
  ],

  // TODO (nd: 2026/05/20): audit this once recommended labware is finalized
  [VACUUM_MODULE_TYPE]: [
    'opentrons_vacuum_module_spacer_thingamajig',
    'opentrons_vacuum_module_gen1_collar_tall',
    'opentrons_vacuum_module_gen1_collar_short',
    'opentrons_96_wellplate_200ul_pcr_full_skirt',
  ],
  // TODO (nd: 2026/05/20): audit this once recommended labware is finalized
  [VACUUM_MODULE_TYPE_WITH_LABWARE]: [
    'opentrons_vacuum_module_gen1_collar_tall',
    'opentrons_vacuum_module_gen1_collar_short',
    'opentrons_96_wellplate_200ul_pcr_full_skirt',
  ],
}
export const getLabwareIsCompatible = (
  def: LabwareDefinition2,
  moduleType: ModuleLabwareCompatibilityKey
): boolean => {
  console.assert(
    moduleType in COMPATIBLE_LABWARE_ALLOWLIST_BY_MODULE_TYPE,
    `expected ${moduleType} in labware<>module compatibility allowlist`
  )
  const allowlist =
    COMPATIBLE_LABWARE_ALLOWLIST_BY_MODULE_TYPE[moduleType] || []
  return allowlist.includes(def.parameters.loadName)
}

export const ADAPTER_96_CHANNEL = 'opentrons_flex_96_tiprack_adapter'

export const getLabwareIsCustom = (
  customLabwares: LabwareDefByDefURI,
  labwareOnDeck: LabwareOnDeck
): boolean => {
  return labwareOnDeck.labwareDefURI in customLabwares
}

// This breaks pattern with other module compatibility checks, but it more exactly mirrors Protocol Engine's logic
// See api/src/opentrons/protocol_engine/state/labware.py for details
const _getLabwareCompatibleWithAbsorbanceReader = (
  def: LabwareDefinition2
): boolean => {
  return (
    Object.entries(def.wells).length === 96 &&
    !def.parameters.isTiprack &&
    def.dimensions.zDimension <= PLATE_READER_MAX_LABWARE_Z_MM
  )
}

const _getLabwareCompatibleWithFlexStacker = (
  def: LabwareDefinition2
): boolean =>
  RECOMMENDED_LABWARE_BY_MODULE[FLEX_STACKER_MODULE_TYPE].includes(
    def.parameters.loadName
  ) ||
  def.metadata.displayCategory === 'wellPlate' ||
  def.metadata.displayCategory === 'reservoir'

const _getLabwareCompatibleWithVacuumModule = (
  def: LabwareDefinition2,
  isDock: boolean = false
): boolean => {
  if (isDock) {
    return (
      COMPATIBLE_LABWARE_ALLOWLIST_BY_MODULE_TYPE[
        VACUUM_MODULE_TYPE_WITH_LABWARE
      ].includes(def.parameters.loadName) ||
      def.metadata.displayCategory === 'wellPlate'
    )
  }
  return (
    COMPATIBLE_LABWARE_ALLOWLIST_BY_MODULE_TYPE[VACUUM_MODULE_TYPE].includes(
      def.parameters.loadName
    ) || def.metadata.displayCategory === 'wellPlate'
  )
}

export const getLabwareCompatibleWithModule = (
  def: LabwareDefinition2,
  moduleType: ModuleLabwareCompatibilityKey
): boolean => {
  switch (moduleType) {
    case FLEX_STACKER_MODULE_TYPE:
      return _getLabwareCompatibleWithFlexStacker(def)
    case ABSORBANCE_READER_TYPE:
      return _getLabwareCompatibleWithAbsorbanceReader(def)
    case VACUUM_MODULE_TYPE:
      return _getLabwareCompatibleWithVacuumModule(def)
    case VACUUM_MODULE_TYPE_WITH_LABWARE:
      return _getLabwareCompatibleWithVacuumModule(def, true)
    default:
      return COMPATIBLE_LABWARE_ALLOWLIST_BY_MODULE_TYPE[moduleType].includes(
        def.parameters.loadName
      )
  }
}
