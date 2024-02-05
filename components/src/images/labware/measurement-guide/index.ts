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
    new URL('./images/dimensions/footprint@3x.png', import.meta.url).href,
    new URL('./images/dimensions/height-tip-rack@3x.png', import.meta.url).href,
  ],
  tubeRack: [
    new URL('./images/dimensions/footprint@3x.png', import.meta.url).href,
    new URL('./images/dimensions/height-tube-rack@3x.png', import.meta.url)
      .href,
  ],
  reservoir: [
    new URL('./images/dimensions/footprint@3x.png', import.meta.url).href,
    new URL(
      './images/dimensions/height-plate-and-reservoir@3x.png',
      import.meta.url
    ).href,
  ],
  irregular: [
    new URL('./images/dimensions/footprint@3x.png', import.meta.url).href,
    new URL(
      './images/dimensions/height-tube-rack-irregular@3x.png',
      import.meta.url
    ).href,
  ],
  adapter: [
    new URL('./images/dimensions/footprint@3x.png', import.meta.url).href,
    new URL(
      './images/dimensions/height-plate-and-reservoir@3x.png',
      import.meta.url
    ).href,
  ],
}

const ALUM_BLOCK_FOOTPRINTS: Diagrams = {
  tubeRack: [
    new URL('./images/dimensions/footprint@3x.png', import.meta.url).href,
    new URL(
      './images/dimensions/height-alum-block-tubes@3x.png',
      import.meta.url
    ).href,
  ],
  wellPlate: [
    new URL('./images/dimensions/footprint@3x.png', import.meta.url).href,
    new URL(
      './images/dimensions/height-alum-block-plate@3x.png',
      import.meta.url
    ).href,
  ],
}

const RESERVOIR_SPACING_DIAGRAMS: Diagrams = {
  singleRow: [
    new URL('./images/offset/offset-reservoir@3x.png', import.meta.url).href,
    new URL('./images/spacing/spacing-reservoir@3x.png', import.meta.url).href,
  ],
  multiRow: [
    new URL('./images/offset/offset-reservoir@3x.png', import.meta.url).href,
    new URL(
      './images/spacing/spacing-reservoir-multi-row@3x.png',
      import.meta.url
    ).href,
  ],
}

const SPACING_DIAGRAMS: Diagrams = {
  circular: [
    new URL('./images/offset/offset-well-circular@3x.png', import.meta.url)
      .href,
    new URL('./images/spacing/spacing-well-circular@3x.png', import.meta.url)
      .href,
  ],
  rectangular: [
    new URL('./images/offset/offset-well-rectangular@3x.png', import.meta.url)
      .href,
    new URL('./images/spacing/spacing-well-rectangular@3x.png', import.meta.url)
      .href,
  ],
}

const TIPRACK_MEASUREMENT_DIAGRAMS: string[] = [
  new URL('./images/depth/length-tip-rack@3x.png', import.meta.url).href,
  new URL('./images/shape/shape-circular@3x.png', import.meta.url).href,
]

type NestedDiagrams = Record<string, Record<string, string[]>>

const PLATE_MEASUREMENT_DIAGRAMS: NestedDiagrams = {
  flat: {
    circular: [
      new URL('./images/depth/depth-plate-flat@3x.png', import.meta.url).href,
      new URL('./images/shape/shape-circular@3x.png', import.meta.url).href,
    ],
    rectangular: [
      new URL('./images/depth/depth-plate-flat@3x.png', import.meta.url).href,
      new URL('./images/shape/shape-rectangular@3x.png', import.meta.url).href,
    ],
  },
  u: {
    circular: [
      new URL('./images/depth/depth-plate-round@3x.png', import.meta.url).href,
      new URL('./images/shape/shape-circular@3x.png', import.meta.url).href,
    ],
    rectangular: [
      new URL('./images/depth/depth-plate-round@3x.png', import.meta.url).href,
      new URL('./images/shape/shape-rectangular@3x.png', import.meta.url).href,
    ],
  },
  v: {
    circular: [
      new URL('./images/depth/depth-plate-v@3x.png', import.meta.url).href,
      new URL('./images/shape/shape-circular@3x.png', import.meta.url).href,
    ],
    rectangular: [
      new URL('./images/depth/depth-plate-v@3x.png', import.meta.url).href,
      new URL('./images/shape/shape-rectangular@3x.png', import.meta.url).href,
    ],
  },
}
const MEASUREMENT_DIAGRAMS: NestedDiagrams = {
  flat: {
    circular: [
      new URL(
        './images/depth/depth-reservoir-and-tubes-flat@3x.png',
        import.meta.url
      ).href,
      new URL('./images/shape/shape-circular@3x.png', import.meta.url).href,
    ],
    rectangular: [
      new URL(
        './images/depth/depth-reservoir-and-tubes-flat@3x.png',
        import.meta.url
      ).href,
      new URL('./images/shape/shape-rectangular@3x.png', import.meta.url).href,
    ],
  },
  u: {
    circular: [
      new URL(
        './images/depth/depth-reservoir-and-tubes-round@3x.png',
        import.meta.url
      ).href,
      new URL('./images/shape/shape-circular@3x.png', import.meta.url).href,
    ],
    rectangular: [
      new URL(
        './images/depth/depth-reservoir-and-tubes-round@3x.png',
        import.meta.url
      ).href,
      new URL('./images/shape/shape-rectangular@3x.png', import.meta.url).href,
    ],
  },
  v: {
    circular: [
      new URL(
        './images/depth/depth-reservoir-and-tubes-v@3x.png',
        import.meta.url
      ).href,
      new URL('./images/shape/shape-circular@3x.png', import.meta.url).href,
    ],
    rectangular: [
      new URL(
        './images/depth/depth-reservoir-and-tubes-v@3x.png',
        import.meta.url
      ).href,
      new URL('./images/shape/shape-rectangular@3x.png', import.meta.url).href,
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
