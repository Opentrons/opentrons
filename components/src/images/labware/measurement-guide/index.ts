export interface DiagramProps {
  guideType?: string
  category?: string
  insertCategory?: string
  shape?: string
  wellBottomShape?: string
  guideVisible?: boolean
  irregular?: boolean
  isMultiRow?: boolean
}

type Diagrams = Record<string, string[]>

const FOOTPRINT_DIAGRAMS: Diagrams = {
  wellPlate: [
    new URL('./images/dimensions/footprint@3x.png', import.meta.url).href,
    new URL(
      './images/dimensions/height-plate-and-reservoir@3x.png',
      import.meta.url
    ).href,
  ],
  tipRack: [
    import('./images/dimensions/footprint@3x.png'),
    import('./images/dimensions/height-tip-rack@3x.png'),
  ],
  tubeRack: [
    import('./images/dimensions/footprint@3x.png'),
    import('./images/dimensions/height-tube-rack@3x.png'),
  ],
  reservoir: [
    import('./images/dimensions/footprint@3x.png'),
    import('./images/dimensions/height-plate-and-reservoir@3x.png'),
  ],
  irregular: [
    import('./images/dimensions/footprint@3x.png'),
    import('./images/dimensions/height-tube-rack-irregular@3x.png'),
  ],
  adapter: [
    import('./images/dimensions/footprint@3x.png'),
    import('./images/dimensions/height-plate-and-reservoir@3x.png'),
  ],
}

const ALUM_BLOCK_FOOTPRINTS: Diagrams = {
  tubeRack: [
    import('./images/dimensions/footprint@3x.png'),
    import('./images/dimensions/height-alum-block-tubes@3x.png'),
  ],
  wellPlate: [
    import('./images/dimensions/footprint@3x.png'),
    import('./images/dimensions/height-alum-block-plate@3x.png'),
  ],
}

const RESERVOIR_SPACING_DIAGRAMS: Diagrams = {
  singleRow: [
    import('./images/offset/offset-reservoir@3x.png'),
    import('./images/spacing/spacing-reservoir@3x.png'),
  ],
  multiRow: [
    import('./images/offset/offset-reservoir@3x.png'),
    import('./images/spacing/spacing-reservoir-multi-row@3x.png'),
  ],
}

const SPACING_DIAGRAMS: Diagrams = {
  circular: [
    import('./images/offset/offset-well-circular@3x.png'),
    import('./images/spacing/spacing-well-circular@3x.png'),
  ],
  rectangular: [
    import('./images/offset/offset-well-rectangular@3x.png'),
    import('./images/spacing/spacing-well-rectangular@3x.png'),
  ],
}

const TIPRACK_MEASUREMENT_DIAGRAMS: string[] = [
  import('./images/depth/length-tip-rack@3x.png'),
  import('./images/shape/shape-circular@3x.png'),
]

type NestedDiagrams = Record<string, Record<string, string[]>>

const PLATE_MEASUREMENT_DIAGRAMS: NestedDiagrams = {
  flat: {
    circular: [
      import('./images/depth/depth-plate-flat@3x.png'),
      import('./images/shape/shape-circular@3x.png'),
    ],
    rectangular: [
      import('./images/depth/depth-plate-flat@3x.png'),
      import('./images/shape/shape-rectangular@3x.png'),
    ],
  },
  u: {
    circular: [
      import('./images/depth/depth-plate-round@3x.png'),
      import('./images/shape/shape-circular@3x.png'),
    ],
    rectangular: [
      import('./images/depth/depth-plate-round@3x.png'),
      import('./images/shape/shape-rectangular@3x.png'),
    ],
  },
  v: {
    circular: [
      import('./images/depth/depth-plate-v@3x.png'),
      import('./images/shape/shape-circular@3x.png'),
    ],
    rectangular: [
      import('./images/depth/depth-plate-v@3x.png'),
      import('./images/shape/shape-rectangular@3x.png'),
    ],
  },
}
const MEASUREMENT_DIAGRAMS: NestedDiagrams = {
  flat: {
    circular: [
      import('./images/depth/depth-reservoir-and-tubes-flat@3x.png'),
      import('./images/shape/shape-circular@3x.png'),
    ],
    rectangular: [
      import('./images/depth/depth-reservoir-and-tubes-flat@3x.png'),
      import('./images/shape/shape-rectangular@3x.png'),
    ],
  },
  u: {
    circular: [
      import('./images/depth/depth-reservoir-and-tubes-round@3x.png'),
      import('./images/shape/shape-circular@3x.png'),
    ],
    rectangular: [
      import('./images/depth/depth-reservoir-and-tubes-round@3x.png'),
      import('./images/shape/shape-rectangular@3x.png'),
    ],
  },
  v: {
    circular: [
      import('./images/depth/depth-reservoir-and-tubes-v@3x.png'),
      import('./images/shape/shape-circular@3x.png'),
    ],
    rectangular: [
      import('./images/depth/depth-reservoir-and-tubes-v@3x.png'),
      import('./images/shape/shape-rectangular@3x.png'),
    ],
  },
}

export function getFootprintDiagram(props: DiagramProps): string[] {
  const { category, insertCategory, irregular } = props
  if (category === 'aluminumBlock') {
    return insertCategory ? ALUM_BLOCK_FOOTPRINTS[insertCategory] : []
  } else if (category === 'tubeRack' && irregular) {
    return FOOTPRINT_DIAGRAMS.irregular
  }
  return category ? FOOTPRINT_DIAGRAMS[category] : []
}

export function getSpacingDiagram(props: DiagramProps): string[] {
  const { category, isMultiRow, shape } = props
  if (category === 'reservoir') {
    return isMultiRow
      ? RESERVOIR_SPACING_DIAGRAMS.multiRow
      : RESERVOIR_SPACING_DIAGRAMS.singleRow
  }

  return shape ? SPACING_DIAGRAMS[shape] : []
}

export function getMeasurementDiagram(props: DiagramProps): string[] {
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
