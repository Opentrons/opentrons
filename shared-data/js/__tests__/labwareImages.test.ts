import { describe, expect, it } from 'vitest'

import { labwareImages } from '../../labware/images/image_details/labware-images'

const ignoredLoadNames = new Set([
  'opentrons_1_trash_1100ml_fixed',
  'opentrons_1_trash_3200ml_fixed',
  'opentrons_1_trash_850ml_fixed',
  'opentrons_40_aluminumblock_eppendorf_24x2ml_safelock_snapcap_generic_16x0.2ml_pcr_strip',
  'opentrons_96_filtertiprack_10ul',
  'opentrons_96_tiprack_10ul',
  'opentrons_flex_96_filtertiprack_20ul',
  'opentrons_flex_96_tiprack_20ul',
  'opentrons_flex_lid_absorbance_plate_reader_module',
  'opentrons_flex_tiprack_lid',
  'protocol_engine_lid_stack_object',
])

const definitionModules = import.meta.glob(
  '../../labware/definitions/2/*/*.{json,ts}',
  {
    eager: true,
    import: 'default',
  }
)
const loadNames = Array.from(
  new Set(
    Object.keys(definitionModules).map(defPath => {
      const parts = defPath.split('/')
      return parts[5]
    })
  )
)

describe('labwareImages mapping', () => {
  it('should have at least one image for every labware definition', () => {
    const missingLoadNames = loadNames.filter(
      loadName =>
        !(loadName in labwareImages) && !ignoredLoadNames.has(loadName)
    )
    expect(missingLoadNames).toEqual([])
  })
})
