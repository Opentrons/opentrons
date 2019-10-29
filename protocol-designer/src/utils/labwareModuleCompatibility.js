// @flow
// PD-specific info about labware<>module compatibilty
import assert from 'assert'
import type { LabwareDefinition2, ModuleType } from '@opentrons/shared-data'

// NOTE: this does not distinguish btw versions. Standard labware only (assumes namespace is 'opentrons')
const COMPATIBLE_LABWARE_WHITELIST_BY_MODULE: {
  [ModuleType]: $ReadOnlyArray<string>,
} = {
  tempdeck: [
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
    'opentrons_96_aluminumblock_biorad_wellplate_200ul',
    'opentrons_96_aluminumblock_generic_pcr_strip_200ul',
    'usascientific_12_reservoir_22ml',
    // 'biotix_1_well_reservoir_?ml', // TODO: Ian 2019-10-29 this is in the doc but doesn't exist
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
  ],
  magdeck: [
    'biorad_96_wellplate_200ul_pcr',
    'usascientific_96_wellplate_2.4ml_deep',
    'nest_96_wellplate_100ul_pcr_full_skirt',
  ],
  thermocycler: [
    'biorad_96_wellplate_200ul_pcr',
    'nest_96_wellplate_100ul_pcr_full_skirt',
  ],
}

export const getLabwareIsCompatible = (
  def: LabwareDefinition2,
  moduleType: ModuleType
): boolean => {
  assert(
    moduleType in COMPATIBLE_LABWARE_WHITELIST_BY_MODULE,
    `expected ${moduleType} in labware<>module compatibility whitelist`
  )
  const whitelist = COMPATIBLE_LABWARE_WHITELIST_BY_MODULE[moduleType] || []
  return whitelist.includes(def.parameters.loadName)
}
