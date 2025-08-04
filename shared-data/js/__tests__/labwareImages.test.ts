import { describe, expect, it } from 'vitest'

import { labwareImages } from '@opentrons/shared-data'

const ignoredLoadNames = new Set([
  'armadillo_96_wellplate_200ul_pcr_full_skirt',
  'corning_96_wellplate_360ul_lid',
  'milliplex_microtiter_plate',
  'milliplex_microtiter_plate_lid',
  'nest_12_reservoir_22ml',
  'nest_24_wellplate_10.4ml',
  'nest_8_reservoir_22ml',
  'opentrons_1_trash_1100ml_fixed',
  'opentrons_1_trash_3200ml_fixed',
  'opentrons_1_trash_850ml_fixed',
  'opentrons_40_aluminumblock_eppendorf_24x2ml_safelock_snapcap_generic_16x0.2ml_pcr_strip',
  'opentrons_96_filtertiprack_1000ul',
  'opentrons_96_filtertiprack_10ul',
  'opentrons_96_filtertiprack_200ul',
  'opentrons_96_filtertiprack_20ul',
  'opentrons_96_tiprack_20ul',
  'opentrons_96_well_aluminum_block',
  'opentrons_96_wellplate_200ul_pcr_full_skirt',
  'opentrons_calibration_adapter_heatershaker_module',
  'opentrons_calibration_adapter_temperature_module',
  'opentrons_calibration_adapter_thermocycler_module',
  'opentrons_flex_96_filtertiprack_1000ul',
  'opentrons_flex_96_filtertiprack_200ul',
  'opentrons_flex_96_filtertiprack_20ul',
  'opentrons_flex_96_filtertiprack_50ul',
  'opentrons_flex_96_tiprack_1000ul',
  'opentrons_flex_96_tiprack_200ul',
  'opentrons_flex_96_tiprack_20ul',
  'opentrons_flex_lid_absorbance_plate_reader_module',
  'opentrons_flex_tiprack_lid',
  'opentrons_tough_12_reservoir_22ml',
  'opentrons_tough_1_reservoir_300ml',
  'opentrons_tough_4_reservoir_72ml',
  'opentrons_tough_universal_lid',
  'protocol_engine_lid_stack_object',
])

// 1. Import all definition files
const definitionModules = import.meta.glob(
  '../../labware/definitions/2/*/*.{json,ts}',
  {
    eager: true,
    import: 'default',
  }
)
// 2. Extract unique load names
const loadNames = Array.from(
  new Set(
    Object.keys(definitionModules).map(defPath => {
      const parts = defPath.split('/')
      return parts[5]
    })
  )
)
console.log(loadNames)

describe('labwareImages mapping', () => {
  it('should have at least one image for every definition loadName', () => {
    const missingLoadNames = loadNames.filter(
      loadName =>
        !(loadName in labwareImages) && !ignoredLoadNames.has(loadName)
    )

    expect(missingLoadNames).toEqual([])
  })
})
