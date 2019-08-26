// @flow
import isEqual from 'lodash/isEqual'
import uniqBy from 'lodash/uniqBy'
import uniqWith from 'lodash/uniqWith'
import round from 'lodash/round'
import orderBy from 'lodash/orderBy'
import type {
  LabwareWell,
  LabwareWellShapeProperties,
  LabwareWellGroupProperties,
  LabwareDefinition,
} from './types'

export function getUniqueWellProperties(
  definition: LabwareDefinition
): Array<LabwareWellGroupProperties> {
  const { groups, wells, dimensions } = definition

  return groups.map(group => {
    const wellProps = orderBy(
      group.wells.map(n => wells[n]),
      ['x', 'y'],
      ['asc', 'desc']
    )
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

    const xStart = wellProps[0].x
    const yStart = wellProps[0].y

    return {
      metadata: group.metadata,
      brand: group.brand || null,
      xSpacing: getSpacing(wellProps, 'x'),
      ySpacing: getSpacing(wellProps, 'y'),
      xOffsetFromLeft: xStart,
      yOffsetFromTop: dimensions.yDimension - yStart,
      wellCount: wellProps.length,
      depth: getIfConsistent(wellDepths),
      totalLiquidVolume: getIfConsistent(wellVolumes),
      shape: getIfConsistent(wellShapes),
    }
  })
}

function getIfConsistent<T>(items: Array<T>): T | null {
  return uniqWith(items, isEqual).length === 1 ? items[0] : null
}

export function getSpacing(
  wells: Array<LabwareWell>,
  axis: 'x' | 'y'
): number | null {
  return uniqBy<LabwareWell>(wells, axis).reduce<number | null>(
    (spacing, well, index, uniqueWells) => {
      if (index > 0) {
        const prev = uniqueWells[index - 1]
        const currentSpacing = Math.abs(round(well[axis] - prev[axis], 2))

        return spacing === 0 || spacing === currentSpacing
          ? currentSpacing
          : null
      }
      return spacing
    },
    0
  )
}
