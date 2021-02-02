// @flow

export type DiagramProps = {|
  guideType?: string,
  category?: string,
  insertCategory?: string,
  shape?: string,
  wellBottomShape?: string,
  guideVisible?: boolean,
  irregular?: boolean,
  isMultiRow?: boolean,
|}

const FOOTPRINT_DIAGRAMS: { [category: string]: Array<string>, ... } = {
  wellPlate: [
    require('./images/dimensions/footprint@3x.png'),
    require('./images/dimensions/height-plate-and-reservoir@3x.png'),
  ],
  tipRack: [
    require('./images/dimensions/footprint@3x.png'),
    require('./images/dimensions/height-tip-rack@3x.png'),
  ],
  tubeRack: [
    require('./images/dimensions/footprint@3x.png'),
    require('./images/dimensions/height-tube-rack@3x.png'),
  ],
  reservoir: [
    require('./images/dimensions/footprint@3x.png'),
    require('./images/dimensions/height-plate-and-reservoir@3x.png'),
  ],
  irregular: [
    require('./images/dimensions/footprint@3x.png'),
    require('./images/dimensions/height-tube-rack-irregular@3x.png'),
  ],
}

const ALUM_BLOCK_FOOTPRINTS: { [category: string]: Array<string>, ... } = {
  tubeRack: [
    require('./images/dimensions/footprint@3x.png'),
    require('./images/dimensions/height-alum-block-tubes@3x.png'),
  ],
  wellPlate: [
    require('./images/dimensions/footprint@3x.png'),
    require('./images/dimensions/height-alum-block-plate@3x.png'),
  ],
}

const RESERVOIR_SPACING_DIAGRAMS: {
  [rows: string]: Array<string>,
  ...,
} = {
  singleRow: [
    require('./images/offset/offset-reservoir@3x.png'),
    require('./images/spacing/spacing-reservoir@3x.png'),
  ],
  multiRow: [
    require('./images/offset/offset-reservoir@3x.png'),
    require('./images/spacing/spacing-reservoir-multi-row@3x.png'),
  ],
}

const SPACING_DIAGRAMS: {
  [shape: string]: Array<string>,
  ...,
} = {
  circular: [
    require('./images/offset/offset-well-circular@3x.png'),
    require('./images/spacing/spacing-well-circular@3x.png'),
  ],
  rectangular: [
    require('./images/offset/offset-well-rectangular@3x.png'),
    require('./images/spacing/spacing-well-rectangular@3x.png'),
  ],
}

const TIPRACK_MEASUREMENT_DIAGRAMS: Array<string> = [
  require('./images/depth/length-tip-rack@3x.png'),
  require('./images/shape/shape-circular@3x.png'),
]

const PLATE_MEASUREMENT_DIAGRAMS: {
  [wellBottomShape: string]: { [shape: string]: Array<string>, ... },
  ...,
} = {
  flat: {
    circular: [
      require('./images/depth/depth-plate-flat@3x.png'),
      require('./images/shape/shape-circular@3x.png'),
    ],
    rectangular: [
      require('./images/depth/depth-plate-flat@3x.png'),
      require('./images/shape/shape-rectangular@3x.png'),
    ],
  },
  u: {
    circular: [
      require('./images/depth/depth-plate-round@3x.png'),
      require('./images/shape/shape-circular@3x.png'),
    ],
    rectangular: [
      require('./images/depth/depth-plate-round@3x.png'),
      require('./images/shape/shape-rectangular@3x.png'),
    ],
  },
  v: {
    circular: [
      require('./images/depth/depth-plate-v@3x.png'),
      require('./images/shape/shape-circular@3x.png'),
    ],
    rectangular: [
      require('./images/depth/depth-plate-v@3x.png'),
      require('./images/shape/shape-rectangular@3x.png'),
    ],
  },
}
const MEASUREMENT_DIAGRAMS: {
  [wellBottomShape: string]: { [shape: string]: Array<string>, ... },
  ...,
} = {
  flat: {
    circular: [
      require('./images/depth/depth-reservoir-and-tubes-flat@3x.png'),
      require('./images/shape/shape-circular@3x.png'),
    ],
    rectangular: [
      require('./images/depth/depth-reservoir-and-tubes-flat@3x.png'),
      require('./images/shape/shape-rectangular@3x.png'),
    ],
  },
  u: {
    circular: [
      require('./images/depth/depth-reservoir-and-tubes-round@3x.png'),
      require('./images/shape/shape-circular@3x.png'),
    ],
    rectangular: [
      require('./images/depth/depth-reservoir-and-tubes-round@3x.png'),
      require('./images/shape/shape-rectangular@3x.png'),
    ],
  },
  v: {
    circular: [
      require('./images/depth/depth-reservoir-and-tubes-v@3x.png'),
      require('./images/shape/shape-circular@3x.png'),
    ],
    rectangular: [
      require('./images/depth/depth-reservoir-and-tubes-v@3x.png'),
      require('./images/shape/shape-rectangular@3x.png'),
    ],
  },
}

export function getFootprintDiagram(props: DiagramProps): Array<string> {
  const { category, insertCategory, irregular } = props
  if (category === 'aluminumBlock') {
    return insertCategory ? ALUM_BLOCK_FOOTPRINTS[insertCategory] : []
  } else if (category === 'tubeRack' && irregular) {
    return FOOTPRINT_DIAGRAMS['irregular']
  }
  return category ? FOOTPRINT_DIAGRAMS[category] : []
}

export function getSpacingDiagram(props: DiagramProps): Array<string> {
  const { category, isMultiRow, shape } = props
  if (category === 'reservoir') {
    return isMultiRow
      ? RESERVOIR_SPACING_DIAGRAMS['multiRow']
      : RESERVOIR_SPACING_DIAGRAMS['singleRow']
  }

  return shape ? SPACING_DIAGRAMS[shape] : []
}

export function getMeasurementDiagram(props: DiagramProps): Array<string> {
  const { category, wellBottomShape, shape } = props
  if (category === 'tipRack') return TIPRACK_MEASUREMENT_DIAGRAMS
  else if (category === 'wellPlate') {
    return wellBottomShape && shape
      ? PLATE_MEASUREMENT_DIAGRAMS[wellBottomShape][shape]
      : []
  }
  return wellBottomShape && shape
    ? MEASUREMENT_DIAGRAMS[wellBottomShape][shape]
    : []
}
