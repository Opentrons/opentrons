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

const FOOTPRINT_IMAGE_RELATIVE_PATH = './images/dimensions/footprint@3x.png'
const DIMENSIONS_HEIGHT_PLATE_IMAGE_RELATIVE_PATH =
  './images/dimensions/height-plate-and-reservoir@3x.png'
const DIMENSIONS_HEIGHT_TIP_RACK_IMAGE_RELATIVE_PATH =
  './images/dimensions/height-tip-rack@3x.png'

const DIMENSIONS_HEIGHT_TUBE_RACK_IMAGE_RELATIVE_PATH =
  './images/dimensions/height-tube-rack@3x.png'

const DIMENSIONS_HEIGHT_TUBE_RACK_IMAGE_IRREGULAR_RELATIVE_PATH =
  './images/dimensions/height-tube-rack-irregular@3x.png'

const HEIGHT_ALUM_BLOCK_TUBES_IMAGE_RELATIVE_PATH =
  './images/dimensions/height-alum-block-tubes@3x.png'

const HEIGHT_ALUM_BLOCK_PLATE_IMAGE_RELATIVE_PATH =
  './images/dimensions/height-alum-block-plate@3x.png'

const OFFSET_RESEVOIR_IMAGE_RELATIVE_PATH =
  './images/offset/offset-reservoir@3x.png'

const SPACING_RESEVOIR_IMAGE_RELATIVE_PATH =
  './images/spacing/spacing-reservoir@3x.png'

const SPACING_RESEVOIR_MULTI_ROW_IMAGE_RELATIVE_PATH =
  './images/spacing/spacing-reservoir-multi-row@3x.png'

const OFFSET_WELL_CIRCULAR_IMAGE_RELATIVE_PATH =
  './images/offset/offset-well-circular@3x.png'

const SPACING_WELL_CIRCULAR_IMAGE_RELATIVE_PATH =
  './images/spacing/spacing-well-circular@3x.png'

const OFFSET_WELL_RECTANGULAR_IMAGE_RELATIVE_PATH =
  './images/offset/offset-well-rectangular@3x.png'

const SPACING_WELL_RECTANGULAR_IMAGE_RELATIVE_PATH =
  './images/spacing/spacing-well-rectangular@3x.png'

const DEPTH_LENGTH_TIP_RACK_IMAGE_RELATIVE_PATH =
  './images/depth/length-tip-rack@3x.png'

const SHAPE_CIRCULAR_IMAGE_RELATIVE_PATH =
  './images/shape/shape-circular@3x.png'

const DEPTH_PLATE_FLAT_IMAGE_RELATIVE_PATH =
  './images/depth/depth-plate-flat@3x.png'

const SHAPE_RECTANGULAR_IMAGE_RELATIVE_PATH =
  './images/shape/shape-rectangular@3x.png'

const DEPTH_PLATE_ROUND_IMAGE_RELATIVE_PATH =
  './images/depth/depth-plate-round@3x.png'

const DEPTH_PLATE_V_SHAPE_IMAGE_RELATIVE_PATH =
  './images/depth/depth-plate-v@3x.png'

const DEPTH_RESEVOIR_AND_TUBES_FLAT_IMAGE_RELATIVE_PATH =
  './images/depth/depth-reservoir-and-tubes-flat@3x.png'

const DEPTH_RESEVOIR_AND_TUBES_ROUND_IMAGE_RELATIVE_PATH =
  './images/depth/depth-reservoir-and-tubes-round@3x.png'

const DEPTH_RESEVOIR_AND_TUBES_V_SHAPE_IMAGE_RELATIVE_PATH =
  './images/depth/depth-reservoir-and-tubes-v@3x.png'

const FOOTPRINT_DIAGRAMS: Diagrams = {
  wellPlate: [
    new URL(FOOTPRINT_IMAGE_RELATIVE_PATH, import.meta.url).href,
    new URL(DIMENSIONS_HEIGHT_PLATE_IMAGE_RELATIVE_PATH, import.meta.url).href,
  ],
  tipRack: [
    new URL(FOOTPRINT_IMAGE_RELATIVE_PATH, import.meta.url).href,
    new URL(DIMENSIONS_HEIGHT_TIP_RACK_IMAGE_RELATIVE_PATH, import.meta.url)
      .href,
  ],
  tubeRack: [
    new URL(FOOTPRINT_IMAGE_RELATIVE_PATH, import.meta.url).href,
    new URL(DIMENSIONS_HEIGHT_TUBE_RACK_IMAGE_RELATIVE_PATH, import.meta.url)
      .href,
  ],
  reservoir: [
    new URL(FOOTPRINT_IMAGE_RELATIVE_PATH, import.meta.url).href,
    new URL(DIMENSIONS_HEIGHT_PLATE_IMAGE_RELATIVE_PATH, import.meta.url).href,
  ],
  irregular: [
    new URL(FOOTPRINT_IMAGE_RELATIVE_PATH, import.meta.url).href,
    new URL(
      DIMENSIONS_HEIGHT_TUBE_RACK_IMAGE_IRREGULAR_RELATIVE_PATH,
      import.meta.url
    ).href,
  ],
  adapter: [
    new URL(FOOTPRINT_IMAGE_RELATIVE_PATH, import.meta.url).href,
    new URL(DIMENSIONS_HEIGHT_PLATE_IMAGE_RELATIVE_PATH, import.meta.url).href,
  ],
  lid: [
    new URL(FOOTPRINT_IMAGE_RELATIVE_PATH, import.meta.url).href,
    new URL(DIMENSIONS_HEIGHT_PLATE_IMAGE_RELATIVE_PATH, import.meta.url).href,
  ],
}

const ALUM_BLOCK_FOOTPRINTS: Diagrams = {
  tubeRack: [
    new URL(FOOTPRINT_IMAGE_RELATIVE_PATH, import.meta.url).href,
    new URL(HEIGHT_ALUM_BLOCK_TUBES_IMAGE_RELATIVE_PATH, import.meta.url).href,
  ],
  wellPlate: [
    new URL(FOOTPRINT_IMAGE_RELATIVE_PATH, import.meta.url).href,
    new URL(HEIGHT_ALUM_BLOCK_PLATE_IMAGE_RELATIVE_PATH, import.meta.url).href,
  ],
}

const RESERVOIR_SPACING_DIAGRAMS: Diagrams = {
  singleRow: [
    new URL(OFFSET_RESEVOIR_IMAGE_RELATIVE_PATH, import.meta.url).href,
    new URL(SPACING_RESEVOIR_IMAGE_RELATIVE_PATH, import.meta.url).href,
  ],
  multiRow: [
    new URL(OFFSET_RESEVOIR_IMAGE_RELATIVE_PATH, import.meta.url).href,
    new URL(SPACING_RESEVOIR_MULTI_ROW_IMAGE_RELATIVE_PATH, import.meta.url)
      .href,
  ],
}

const SPACING_DIAGRAMS: Diagrams = {
  circular: [
    new URL(OFFSET_WELL_CIRCULAR_IMAGE_RELATIVE_PATH, import.meta.url).href,
    new URL(SPACING_WELL_CIRCULAR_IMAGE_RELATIVE_PATH, import.meta.url).href,
  ],
  rectangular: [
    new URL(OFFSET_WELL_RECTANGULAR_IMAGE_RELATIVE_PATH, import.meta.url).href,
    new URL(SPACING_WELL_RECTANGULAR_IMAGE_RELATIVE_PATH, import.meta.url).href,
  ],
}

const TIPRACK_MEASUREMENT_DIAGRAMS: string[] = [
  new URL(DEPTH_LENGTH_TIP_RACK_IMAGE_RELATIVE_PATH, import.meta.url).href,
  new URL(SHAPE_CIRCULAR_IMAGE_RELATIVE_PATH, import.meta.url).href,
]

type NestedDiagrams = Record<string, Record<string, string[]>>

const PLATE_MEASUREMENT_DIAGRAMS: NestedDiagrams = {
  flat: {
    circular: [
      new URL(DEPTH_PLATE_FLAT_IMAGE_RELATIVE_PATH, import.meta.url).href,
      new URL(SHAPE_CIRCULAR_IMAGE_RELATIVE_PATH, import.meta.url).href,
    ],
    rectangular: [
      new URL(DEPTH_PLATE_FLAT_IMAGE_RELATIVE_PATH, import.meta.url).href,
      new URL(SHAPE_RECTANGULAR_IMAGE_RELATIVE_PATH, import.meta.url).href,
    ],
  },
  u: {
    circular: [
      new URL(DEPTH_PLATE_ROUND_IMAGE_RELATIVE_PATH, import.meta.url).href,
      new URL(SHAPE_CIRCULAR_IMAGE_RELATIVE_PATH, import.meta.url).href,
    ],
    rectangular: [
      new URL(DEPTH_PLATE_ROUND_IMAGE_RELATIVE_PATH, import.meta.url).href,
      new URL(SHAPE_RECTANGULAR_IMAGE_RELATIVE_PATH, import.meta.url).href,
    ],
  },
  v: {
    circular: [
      new URL(DEPTH_PLATE_V_SHAPE_IMAGE_RELATIVE_PATH, import.meta.url).href,
      new URL(SHAPE_CIRCULAR_IMAGE_RELATIVE_PATH, import.meta.url).href,
    ],
    rectangular: [
      new URL(DEPTH_PLATE_V_SHAPE_IMAGE_RELATIVE_PATH, import.meta.url).href,
      new URL(SHAPE_RECTANGULAR_IMAGE_RELATIVE_PATH, import.meta.url).href,
    ],
  },
}
const MEASUREMENT_DIAGRAMS: NestedDiagrams = {
  flat: {
    circular: [
      new URL(
        DEPTH_RESEVOIR_AND_TUBES_FLAT_IMAGE_RELATIVE_PATH,
        import.meta.url
      ).href,
      new URL(SHAPE_CIRCULAR_IMAGE_RELATIVE_PATH, import.meta.url).href,
    ],
    rectangular: [
      new URL(
        DEPTH_RESEVOIR_AND_TUBES_FLAT_IMAGE_RELATIVE_PATH,
        import.meta.url
      ).href,
      new URL(SHAPE_RECTANGULAR_IMAGE_RELATIVE_PATH, import.meta.url).href,
    ],
  },
  u: {
    circular: [
      new URL(
        DEPTH_RESEVOIR_AND_TUBES_ROUND_IMAGE_RELATIVE_PATH,
        import.meta.url
      ).href,
      new URL(SHAPE_CIRCULAR_IMAGE_RELATIVE_PATH, import.meta.url).href,
    ],
    rectangular: [
      new URL(
        DEPTH_RESEVOIR_AND_TUBES_ROUND_IMAGE_RELATIVE_PATH,
        import.meta.url
      ).href,
      new URL(SHAPE_RECTANGULAR_IMAGE_RELATIVE_PATH, import.meta.url).href,
    ],
  },
  v: {
    circular: [
      new URL(
        DEPTH_RESEVOIR_AND_TUBES_V_SHAPE_IMAGE_RELATIVE_PATH,
        import.meta.url
      ).href,
      new URL(SHAPE_CIRCULAR_IMAGE_RELATIVE_PATH, import.meta.url).href,
    ],
    rectangular: [
      new URL(
        DEPTH_RESEVOIR_AND_TUBES_V_SHAPE_IMAGE_RELATIVE_PATH,
        import.meta.url
      ).href,
      new URL(SHAPE_RECTANGULAR_IMAGE_RELATIVE_PATH, import.meta.url).href,
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
