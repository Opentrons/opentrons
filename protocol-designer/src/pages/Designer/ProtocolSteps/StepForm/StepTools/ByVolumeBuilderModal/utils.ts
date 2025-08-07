import { COLORS, TYPOGRAPHY } from '@opentrons/components'

import type { LiquidHandlingPropertyByVolume } from '@opentrons/shared-data'
import type { DataPoint } from './types'

export const getByVolumeMappedToXY = (
  data: LiquidHandlingPropertyByVolume
): Array<{ x: number; y: number }> =>
  data.map(item => ({
    x: item[0],
    y: item[1],
  }))

export const getAnnotations = (
  dataPoints: DataPoint[],
  decimalPlaces: number = 1
): any => {
  return dataPoints.map(point => ({
    xref: 'x',
    yref: 'y',
    x: point.x,
    y: point.y,
    text: `(${point.x.toFixed(decimalPlaces)}, ${point.y.toFixed(
      decimalPlaces
    )})`,
    showarrow: false,
    xanchor: 'center',
    yanchor: 'bottom',
    yshift: 15,
    font: {
      color: COLORS.black90,
      size: TYPOGRAPHY.fontSize20,
    },
    opacity: 1,
    editable: false,
  }))
}

const POINT_SCALAR = 0.02

export const getShapes = (
  dataPoints: DataPoint[],
  axisRangeX: number,
  axisRangeY: number
): any => {
  const shapeXRadius = (axisRangeX * POINT_SCALAR) / 2
  const shapeYRadius = (axisRangeY * POINT_SCALAR) / 2
  return dataPoints.map(point => ({
    type: 'circle',
    xref: 'x',
    yref: 'y',
    x0: point.x - shapeXRadius,
    y0: point.y - shapeYRadius,
    x1: point.x + shapeXRadius,
    y1: point.y + shapeYRadius,
    fillcolor: COLORS.blue50,
    line: { width: 0 },
    editable: true,
    name: String(point.x),
  }))
}
