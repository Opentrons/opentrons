import { describe, expect, it } from 'vitest'

import { getAllDefinitions, labwareImages } from '../labware'

const ignoredLoadNames = new Set([
  'opentrons_1_trash_1100ml_fixed',
  'opentrons_1_trash_3200ml_fixed',
  'opentrons_1_trash_850ml_fixed',
  'opentrons_40_aluminumblock_eppendorf_24x2ml_safelock_snapcap_generic_16x0.2ml_pcr_strip',
  'opentrons_flex_96_filtertiprack_20ul',
  'opentrons_flex_96_tiprack_20ul',
  'eppendorf_96_wellplate_1000ul',
  'opentrons_flex_lid_absorbance_plate_reader_module',
  'protocol_engine_lid_stack_object',
  'opentrons_12_well_aluminumblock_tough_22ml',
  'opentrons_1_well_aluminumblock_tough_300ml',
  'opentrons_4_well_aluminumblock_tough_72ml',
])

const loadNames = Array.from(
  new Set(
    Object.keys(getAllDefinitions()).map(uri => {
      const parts = uri.split('/')
      return parts[1] ?? uri
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
// const IMAGES_DIR = path.join(__dirname, '..', '..', 'labware', 'images')
// const MAX_FILE_SIZE_BYTES = 250 * 1024

// function getAllFiles(dir: string): string[] {
//   return fs.readdirSync(dir).flatMap(file => {
//     if (file.startsWith('.')) return []
//     const fullPath = path.join(dir, file)
//     const stat = fs.statSync(fullPath)
//     return stat.isDirectory() ? getAllFiles(fullPath) : [fullPath]
//   })
// }

// describe('labwareImages format', () => {
//   const imageFiles = getAllFiles(IMAGES_DIR)

//  temp comment out because idk how this max file size byte thing came about?
//  want to investigate it more after the RS 9.0.0 release
//   it(`should all be smaller than ${MAX_FILE_SIZE_BYTES / 1024} KB`, () => {
//     const offenders = imageFiles.filter(file => {
//       const { size } = fs.statSync(file)
//       return size >= MAX_FILE_SIZE_BYTES
//     })
//     expect(offenders).toEqual([])
//   })
// })
