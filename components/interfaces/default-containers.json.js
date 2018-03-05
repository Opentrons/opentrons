import type {LabwareLocations} from '../src/labware-types'

declare module './src/default-containers.json' {
  declare var containers: {
    [containerType: string]: {
      'origin-offset'?: {
        x: number,
        y: number
      },
      locations: LabwareLocations
    }
  }
}
