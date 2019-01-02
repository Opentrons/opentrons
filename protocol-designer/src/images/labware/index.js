// @flow
const _fileMap = {
  '96-Deep-Well': require('./96-Deep-Well.png'),
  '96-PCR-Flatt': require('./96-PCR-Flatt.png'),
  '96-PCR-Tall': require('./96-PCR-Tall.png'),
  '384-plate': require('./384-plate.png'),
  'Opentrons-4-in-1-tuberack-15-50': require('./Opentrons-4-in-1-tuberack-15-50.png'),
  'Tiprack-10ul-H': require('./Tiprack-10ul-H.png'),
  'Tiprack-10ul': require('./Tiprack-10ul.png'),
  'Tiprack-200ul': require('./Tiprack-200ul.png'),
  'Tiprack-1000': require('./Tiprack-1000.png'),
  'Trough-12row': require('./Trough-12row.png'),
  'Tuberack-2ml': require('./Tuberack-2ml.png'),
  'Tuberack-15-50ml': require('./Tuberack-15-50ml.png'),
  'Tuberack-075ml': require('./Tuberack-075ml.png'),
}

export const getLabwareDiagramURL = (fileName?: string): ?string =>
  (fileName && _fileMap[fileName]) || null
