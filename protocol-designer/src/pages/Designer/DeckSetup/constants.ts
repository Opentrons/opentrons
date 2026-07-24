import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  CURSOR_POINTER,
  DISPLAY_FLEX,
  POSITION_ABSOLUTE,
  PRODUCT,
} from '@opentrons/components'
import {
  ABSORBANCE_READER_TYPE,
  ABSORBANCE_READER_V1,
  FLEX_STACKER_MODULE_TYPE,
  FLEX_STACKER_MODULE_V1,
  HEATERSHAKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_BLOCK_TYPE,
  MAGNETIC_BLOCK_V1,
  MAGNETIC_MODULE_TYPE,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
  TEMPERATURE_MODULE_TYPE,
  TEMPERATURE_MODULE_V1,
  TEMPERATURE_MODULE_V2,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V1,
  THERMOCYCLER_MODULE_V2,
  VACUUM_MODULE_TYPE,
  VACUUM_MODULE_V1,
} from '@opentrons/shared-data'

import { VACUUM_MODULE_TYPE_WITH_LABWARE } from '../../../constants'

import type { ModuleModel } from '@opentrons/shared-data'
import type { ModuleLabwareCompatibilityKey } from '../../../types'

export const FLEX_MODULE_MODELS: ModuleModel[] = [
  ABSORBANCE_READER_V1,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_BLOCK_V1,
  TEMPERATURE_MODULE_V2,
  THERMOCYCLER_MODULE_V2,
  FLEX_STACKER_MODULE_V1,
  VACUUM_MODULE_V1,
]

export const OT2_MODULE_MODELS: ModuleModel[] = [
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
  TEMPERATURE_MODULE_V1,
  TEMPERATURE_MODULE_V2,
  THERMOCYCLER_MODULE_V2,
  THERMOCYCLER_MODULE_V1,
]

export type Fixture =
  | 'stagingArea'
  | 'trashBin'
  | 'wasteChute'
  | 'wasteChuteAndStagingArea'

export const FIXTURES: Fixture[] = [
  'stagingArea',
  'trashBin',
  'wasteChute',
  'wasteChuteAndStagingArea',
]

//  labware categories
export const ORDERED_CATEGORIES: string[] = [
  'tipRack',
  'tubeRack',
  'wellPlate',
  'reservoir',
  'aluminumBlock',
  'adapter',
  'lid',
]
export const CUSTOM_CATEGORY = 'custom'
export const ALL_ORDERED_CATEGORIES = [CUSTOM_CATEGORY, ...ORDERED_CATEGORIES]

export const RECOMMENDED_LABWARE_BY_MODULE: {
  [K in ModuleLabwareCompatibilityKey]: string[]
} = {
  [TEMPERATURE_MODULE_TYPE]: [
    'opentrons_24_aluminumblock_generic_2ml_screwcap',
    'opentrons_96_well_aluminum_block',
    'opentrons_96_aluminumblock_generic_pcr_strip_200ul',
    'opentrons_24_aluminumblock_nest_1.5ml_screwcap',
    'opentrons_24_aluminumblock_nest_1.5ml_snapcap',
    'opentrons_24_aluminumblock_nest_2ml_screwcap',
    'opentrons_24_aluminumblock_nest_2ml_snapcap',
    'opentrons_24_aluminumblock_nest_0.5ml_screwcap',
    'opentrons_aluminum_flat_bottom_plate',
    'opentrons_96_deep_well_temp_mod_adapter',
  ],
  [MAGNETIC_MODULE_TYPE]: [
    'nest_96_wellplate_100ul_pcr_full_skirt',
    'nest_96_wellplate_2ml_deep',
    'opentrons_96_wellplate_200ul_pcr_full_skirt',
  ],
  [THERMOCYCLER_MODULE_TYPE]: [
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
  ],
  [ABSORBANCE_READER_TYPE]: ['nest_96_wellplate_200ul_flat'],
  [FLEX_STACKER_MODULE_TYPE]: [
    // all flex tipracks
    'opentrons_flex_96_filtertiprack_1000ul',
    'opentrons_flex_96_filtertiprack_200ul',
    'opentrons_flex_96_filtertiprack_50ul',
    'opentrons_flex_96_filtertiprack_20ul',
    'opentrons_flex_96_tiprack_1000ul',
    'opentrons_flex_96_tiprack_200ul',
    'opentrons_flex_96_tiprack_50ul',
    'opentrons_flex_96_tiprack_20ul',
    // tested and verified well plates
    'opentrons_96_wellplate_200ul_pcr_full_skirt',
    'biorad_96_wellplate_200ul_pcr',
    'biorad_384_wellplate_50ul',
    'corning_24_wellplate_3.4ml_flat',
    'nest_96_wellplate_2ml_deep',
    'nest_96_wellplate_100ul_pcr_full_skirt',
    'nest_96_wellplate_200ul_flat',
    // Opentrons-branded reservoirs
    'opentrons_tough_12_reservoir_22ml',
    'opentrons_tough_1_reservoir_300ml',
    'opentrons_tough_4_reservoir_72ml',
  ],
  // TODO (nd: 2026/05/20): audit this once recommended labware is finalized
  [VACUUM_MODULE_TYPE]: [
    'opentrons_vacuum_manifold_collar_tall',
    'opentrons_vacuum_manifold_collar_short',
    'opentrons_96_wellplate_200ul_pcr_full_skirt',
    'nest_96_wellplate_2ml_deep',
    'opentrons_vacuum_manifold_spacer_tall',
    'opentrons_vacuum_manifold_spacer_short',
  ],
  // TODO (nd: 2026/05/20): audit this once recommended labware is finalized
  [VACUUM_MODULE_TYPE_WITH_LABWARE]: [
    'opentrons_vacuum_manifold_collar_tall',
    'opentrons_vacuum_manifold_collar_short',
    'opentrons_96_wellplate_200ul_pcr_full_skirt',
  ],
}

export const MOAM_MODELS_WITH_FF: ModuleModel[] = [TEMPERATURE_MODULE_V2]
export const MOAM_MODELS: ModuleModel[] = [
  TEMPERATURE_MODULE_V2,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_BLOCK_V1,
  ABSORBANCE_READER_V1,
]

export const MAX_MOAM_MODULES = 7
//  limiting 10 instead of 11 to make space for a single default tiprack
//  to be auto-generated
export const MAX_MAGNETIC_BLOCKS = 10

export const DECK_CONTROLS_STYLE_BASE = {
  position: POSITION_ABSOLUTE,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  cursor: CURSOR_POINTER,
}

export const DECK_CONTROLS_STYLE = {
  ...DECK_CONTROLS_STYLE_BASE,
  transform: 'rotate(180deg) scaleX(-1)',
  zIndex: 1,
  backgroundColor: `${COLORS.black90}cc`,
  display: DISPLAY_FLEX,
  alignItems: ALIGN_CENTER,
  color: COLORS.white,
  fontSize: PRODUCT.TYPOGRAPHY.fontFamilyBodyDefaultRegular,
  borderRadius: BORDERS.borderRadius8,
}
