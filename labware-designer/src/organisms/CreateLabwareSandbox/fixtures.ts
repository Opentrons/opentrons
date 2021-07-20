import type {
  RegularLabwareProps,
  IrregularLabwareProps,
} from '@opentrons/shared-data'

export const IRREGULAR_OPTIONS: IrregularLabwareProps = {
  namespace: 'opentrons',
  metadata: {
    displayName: 'Opentrons 10 Tube Rack with Falcon 4x50 mL, 6x15 mL Conical',
    displayCategory: 'tubeRack',
    displayVolumeUnits: 'mL',
    tags: [],
  },
  parameters: {
    format: 'irregular',
    isTiprack: false,
    isMagneticModuleCompatible: false,
  },
  dimensions: {
    xDimension: 127.75,
    yDimension: 85.5,
    zDimension: 123.76,
  },
  offset: [
    { x: 13.88, y: 17.75, z: 123.76 },
    { x: 71.38, y: 25.25, z: 119.8 },
  ],
  grid: [
    { row: 3, column: 2 },
    { row: 2, column: 2 },
  ],
  spacing: [
    { row: 25, column: 25 },
    { row: 35, column: 35 },
  ],
  well: [
    {
      totalLiquidVolume: 15000,
      diameter: 14.9,
      shape: 'circular',
      depth: 117.98,
    },
    {
      totalLiquidVolume: 50000,
      diameter: 27.81,
      shape: 'circular',
      depth: 113.85,
    },
  ],
  gridStart: [
    { rowStart: 'A', colStart: '1', rowStride: 1, colStride: 1 },
    { rowStart: 'A', colStart: '3', rowStride: 1, colStride: 1 },
  ],
  group: [
    {
      metadata: {
        displayName: 'Falcon 6x15 mL Conical',
        displayCategory: 'tubeRack',
        wellBottomShape: 'v',
      },
      brand: {
        brand: 'Falcon',
        brandId: ['352095', '352096', '352097', '352099', '352196'],
        links: [
          'https://ecatalog.corning.com/life-sciences/b2c/US/en/Liquid-Handling/Tubes,-Liquid-Handling/Centrifuge-Tubes/Falcon%C2%AE-Conical-Centrifuge-Tubes/p/falconConicalTubes',
        ],
      },
    },
    {
      metadata: {
        displayName: 'Falcon 4x50 mL Conical',
        displayCategory: 'tubeRack',
        wellBottomShape: 'v',
      },
      brand: {
        brand: 'Falcon',
        brandId: ['352070', '352098'],
        links: [
          'https://ecatalog.corning.com/life-sciences/b2c/US/en/Liquid-Handling/Tubes,-Liquid-Handling/Centrifuge-Tubes/Falcon%C2%AE-Conical-Centrifuge-Tubes/p/falconConicalTubes',
        ],
      },
    },
  ],
  brand: {
    brand: 'Opentrons',
    brandId: [],
    links: [
      'https://shop.opentrons.com/collections/opentrons-tips/products/tube-rack-set-1',
    ],
  },
}

export const REGULAR_OPTIONS: RegularLabwareProps = {
  namespace: 'opentrons',
  metadata: {
    displayName: 'Corning 96 Well Plate 360 µL Flat',
    displayCategory: 'wellPlate',
    displayVolumeUnits: 'µL',
    tags: [],
  },
  loadNamePostfix: ['flat'],
  parameters: {
    format: '96Standard',
    isTiprack: false,
    isMagneticModuleCompatible: false,
  },
  offset: { x: 14.38, y: 11.23, z: 14.22 },
  dimensions: {
    xDimension: 127.76,
    yDimension: 85.47,
    zDimension: 14.22,
  },
  grid: { row: 8, column: 12 },
  spacing: { row: 9, column: 9 },
  well: {
    depth: 10.67,
    shape: 'circular',
    diameter: 6.86,
    totalLiquidVolume: 360,
  },
  group: {
    metadata: {
      wellBottomShape: 'flat',
    },
  },
  brand: {
    brand: 'Corning',
    brandId: [
      '3650',
      '3916',
      '3915',
      '3361',
      '3590',
      '9018',
      '3591',
      '9017',
      '3641',
      '3628',
      '3370',
      '2507',
      '2509',
      '2503',
      '3665',
      '3600',
      '3362',
      '3917',
      '3912',
      '3925',
      '3922',
      '3596',
      '3977',
      '3598',
      '3599',
      '3585',
      '3595',
      '3300',
      '3474',
    ],
    links: [
      'https://ecatalog.corning.com/life-sciences/b2c/US/en/Microplates/Assay-Microplates/96-Well-Microplates/Corning%C2%AE-96-well-Solid-Black-and-White-Polystyrene-Microplates/p/corning96WellSolidBlackAndWhitePolystyreneMicroplates',
    ],
  },
}
