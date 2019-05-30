// @flow

export type DiagramProps = {|
  guideType?: string,
  category?: string,
  insertCategory?: string,
  shape?: string,
  wellBottomShape?: string,
  guideVisible?: boolean,
  isIrregular?: boolean,
|}

const FOOTPRINT_DIAGRAMS: { [category: string]: Array<?string> } = {
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

const ALUM_BLOCK_FOOTPRINTS: { [category: string]: Array<?string> } = {
  tubeRack: [
    require('./images/dimensions/footprint@3x.png'),
    require('./images/dimensions/height-alum-block-tubes@3x.png'),
  ],
  wellPlate: [
    require('./images/dimensions/footprint@3x.png'),
    require('./images/dimensions/height-alum-block-plate@3x.png'),
  ],
}

const RESERVOIR_SPACING_DIAGRAMS: Array<?string> = [
  require('./images/spacing/spacing-reservoir@3x.png'),
]

const SPACING_DIAGRAMS: {
  [shape: string]: Array<?string>,
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

const TIPRACK_MEASUREMENT_DIAGRAMS: Array<?string> = [
  require('./images/depth/length-tip-rack@3x.png'),
  require('./images/shape/shape-circular@3x.png'),
]

const PLATE_MEASUREMENT_DIAGRAMS: {
  [wellBottomShape: string]: { [shape: string]: Array<?string> },
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
  [wellBottomShape: string]: { [shape: string]: Array<?string> },
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

export function getDiagramSrc(props: DiagramProps) {
  const {
    guideType,
    category,
    shape,
    wellBottomShape,
    insertCategory,
    isIrregular,
  } = props

  switch (guideType) {
    case 'footprint':
      console.log()
      if (category === 'aluminumBlock') {
        return insertCategory && ALUM_BLOCK_FOOTPRINTS[insertCategory]
      } else if (category === 'tubeRack' && isIrregular) {
        return FOOTPRINT_DIAGRAMS['irregular']
      }
      return category && FOOTPRINT_DIAGRAMS[category]

    case 'spacing':
      return category === 'reservoir'
        ? RESERVOIR_SPACING_DIAGRAMS
        : shape && SPACING_DIAGRAMS[shape]

    case 'measurements':
      if (category === 'tipRack') return TIPRACK_MEASUREMENT_DIAGRAMS
      else if (category === 'wellPlate') {
        console.log(wellBottomShape, shape)
        return (
          wellBottomShape &&
          shape &&
          PLATE_MEASUREMENT_DIAGRAMS[wellBottomShape][shape]
        )
      }
      return (
        wellBottomShape && shape && MEASUREMENT_DIAGRAMS[wellBottomShape][shape]
      )
  }
}
