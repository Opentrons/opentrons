import isEqual from 'lodash/isEqual'
import round from 'lodash/round'
import sortedUniq from 'lodash/sortedUniq'
import uniq from 'lodash/uniq'
import uniqWith from 'lodash/uniqWith'

import type {
  LabwareBrand,
  LabwareDefinition,
  LabwareWell,
  LabwareWellGroupMetadata,
  LabwareWellShapeProperties,
} from '../types'

export interface LabwareWellGroupProperties {
  xOffsetFromLeft: number
  yOffsetFromBack: number
  xSpacing: number | null
  ySpacing: number | null
  wellCount: number
  shape: LabwareWellShapeProperties | null
  depth: number | null
  totalLiquidVolume: number | null
  metadata: LabwareWellGroupMetadata
  brand: LabwareBrand | null
}
const ROUNDING_PRECISION = 2

export function getUniqueWellProperties(
  definition: LabwareDefinition
): LabwareWellGroupProperties[] {
  const { groups, wells } = definition

  return groups.map(group => {
    const wellProps = group.wells.map(n => wells[n])

    const wellDepths = wellProps.map<number>(w => w.depth)
    const wellVolumes = wellProps.map<number>(w => w.totalLiquidVolume)
    const wellShapes = wellProps.map<LabwareWellShapeProperties>(
      (well: LabwareWell) =>
        well.shape === 'circular'
          ? { shape: well.shape, diameter: well.diameter }
          : {
              shape: well.shape,
              xDimension: well.xDimension,
              yDimension: well.yDimension,
            }
    )

    // todo(mm, 2025-05-21): The schema does not prescribe an order to `group.wells`,
    // though in practice the first element is probably always A1. Either make that
    // official in the schema, or change this to consult `definition.ordering`,
    // or change this to find the back-left-most well.
    const firstWellX = wellProps[0]?.x ?? 0
    const firstWellY = wellProps[0]?.y ?? 0

    const leftEdgeX =
      definition.schemaVersion === 2
        ? 0
        : definition.extents.total.backLeftBottom.x
    const backEdgeY =
      definition.schemaVersion === 2
        ? definition.dimensions.yDimension
        : definition.extents.total.backLeftBottom.y

    return {
      metadata: group.metadata,
      brand: group.brand || null,
      xSpacing: getSpacingIfUniform(wellProps, 'x'),
      ySpacing: getSpacingIfUniform(wellProps, 'y'),
      xOffsetFromLeft: round(firstWellX - leftEdgeX, ROUNDING_PRECISION),
      yOffsetFromBack: round(backEdgeY - firstWellY, ROUNDING_PRECISION),
      wellCount: wellProps.length,
      depth: getIfConsistent(wellDepths),
      totalLiquidVolume: getIfConsistent(wellVolumes),
      shape: getIfConsistent(wellShapes),
    }
  })
}

export function getIfConsistent<T>(items: T[]): T | null {
  return uniqWith(items, isEqual).length === 1 ? items[0] : null
}

// returning null means "spacing is irregular"; returning 0 means "there is only 1 well along the given axis"
export function getSpacingIfUniform(
  wells: LabwareWell[],
  axis: 'x' | 'y'
): number | null {
  const wellPositions = sortedUniq(uniq(wells.map(well => well[axis])))
  if (wellPositions.length < 2) return 0

  const initialSpacing = round(
    wellPositions[1] - wellPositions[0],
    ROUNDING_PRECISION
  )

  for (let i = 2; i < wellPositions.length; i++) {
    const pos = wellPositions[i]
    const prevWellPos = wellPositions[i - 1]
    const spacing = round(pos - prevWellPos, ROUNDING_PRECISION)
    if (spacing !== initialSpacing) return null
  }

  return Math.abs(initialSpacing)
}
