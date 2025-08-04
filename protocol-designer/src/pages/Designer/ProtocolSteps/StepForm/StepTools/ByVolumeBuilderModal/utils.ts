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

export const getShapes = (dataPoints: DataPoint[], axisRange: number): any => {
  const shapeRadius = axisRange / 50 / 2
  return dataPoints.map(point => ({
    type: 'circle',
    xref: 'x',
    yref: 'y',
    x0: point.x - shapeRadius,
    y0: point.y - shapeRadius,
    x1: point.x + shapeRadius,
    y1: point.y + shapeRadius,
    fillcolor: COLORS.blue50,
    line: { width: 0 },
    editable: true,
    name: String(point.x),
  }))
}
