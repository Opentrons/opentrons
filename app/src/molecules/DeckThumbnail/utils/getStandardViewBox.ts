import type { RobotType } from '@opentrons/shared-data'

const OT2_VIEWBOX = '-75 -20 586 480'
const OT3_VIEWBOX = '-144.31 -76.59 750 580'

export const getStandardDeckViewBox = (robotType: RobotType): string | null => {
  switch (robotType) {
    case 'OT-2 Standard':
      return OT2_VIEWBOX
    case 'OT-3 Standard':
      return OT3_VIEWBOX
    default:
      return null
  }
}
