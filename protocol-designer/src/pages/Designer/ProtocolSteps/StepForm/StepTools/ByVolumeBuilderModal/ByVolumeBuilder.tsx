import { useTranslation } from 'react-i18next'
import createPlotlyComponent from 'react-plotly.js/factory'
import Plotly from 'plotly.js-cartesian-dist'

import {
  AXIS_OFFSET_PERCENTAGE,
  BASE_DATA,
  BASE_LAYOUT,
  CONFIG,
} from './constants'
import { getAnnotations, getShapes } from './utils'

import type { ReactNode } from 'react'
import type { LiquidHandlingPropertyByVolume } from '@opentrons/shared-data'
import type { ByVolumeType, DataPoint } from './types'

const Plot = createPlotlyComponent(Plotly)

export function ByVolumeBuilder(props: {
  type: ByVolumeType
  dataPoints: DataPoint[]
  setDataPoints: (dataPoints: DataPoint[]) => void
  byVolume: LiquidHandlingPropertyByVolume
  maxX: number
  maxY: number
}): ReactNode {
  const { type, dataPoints, setDataPoints, maxX, maxY } = props

  const { t } = useTranslation('by_volume_builder')

  const handleRelayout = (eventData: any): void => {
    const updatedPoints = [...dataPoints]
    let changed = false

    // Handle shape-based editing (when shapes are moved)
    for (let i = 0; i < updatedPoints.length; i++) {
      const shapeX0Key = `shapes[${i}].x0`
      const shapeY0Key = `shapes[${i}].y0`
      const shapeX1Key = `shapes[${i}].x1`
      const shapeY1Key = `shapes[${i}].y1`

      if (
        eventData[shapeX0Key] !== undefined &&
        eventData[shapeY0Key] !== undefined &&
        eventData[shapeX1Key] !== undefined &&
        eventData[shapeY1Key] !== undefined
      ) {
        // Calculate center point from shape bounds
        const newX = (eventData[shapeX0Key] + eventData[shapeX1Key]) / 2
        const newY = (eventData[shapeY0Key] + eventData[shapeY1Key]) / 2

        if (updatedPoints[i].x !== newX || updatedPoints[i].y !== newY) {
          updatedPoints[i] = {
            ...updatedPoints[i],
            x: Math.min(Math.max(newX, 0), maxX),
            y: Math.min(Math.max(newY, 0), maxY),
          }
          changed = true
        }
      }
    }

    // Handle data-based editing (when data points are moved directly)
    const xEventData = eventData['data[0].x']
    const yEventData = eventData['data[0].y']
    if (xEventData != null && yEventData != null) {
      const newXValues = xEventData as number[]
      const newYValues = yEventData as number[]

      for (let i = 0; i < updatedPoints.length; i++) {
        const newX = newXValues[i]
        const newY = newYValues[i]

        if (updatedPoints[i].x !== newX || updatedPoints[i].y !== newY) {
          updatedPoints[i] = {
            ...updatedPoints[i],
            x: Math.max(newX, 0),
            y: Math.max(newY, 0),
          }
          changed = true
        }
      }
    }

    if (changed) {
      const sortedPoints = updatedPoints.sort((a, b) => a.x - b.x)
      setDataPoints(sortedPoints)
    }
  }
  const axisOffsetX = maxX * AXIS_OFFSET_PERCENTAGE
  const axisOffsetY = maxY * AXIS_OFFSET_PERCENTAGE
  const axisRangeX = maxX + 2 * axisOffsetX
  const axisRangeY = maxY + 2 * axisOffsetY
  return (
    <div>
      <Plot
        data={[
          {
            ...BASE_DATA,
            // ensure the curve starts at 0 and ends at maxVolume
            x: [0, ...dataPoints.map(p => p.x), maxX],
            y: [
              dataPoints[0].y,
              ...dataPoints.map(p => p.y),
              dataPoints[dataPoints.length - 1].y,
            ],
          },
        ]}
        layout={{
          ...BASE_LAYOUT,
          title: {
            text: t('instructions'),
            xanchor: 'right',
          },
          xaxis: {
            title: {
              text: t(`${type}.axes.x.label`, {
                units: t(`${type}.axes.x.units`),
              }),
              editable: false,
            },
            range: [-1 * axisOffsetX, maxX + axisOffsetX],
          },
          yaxis: {
            title: {
              text: t(`${type}.axes.y.label`, {
                units: t(`${type}.axes.y.units`),
              }),
              editable: false,
            },
            range: [-1 * axisOffsetY, maxY + axisOffsetY],
          },
          shapes: getShapes(dataPoints, axisRangeX, axisRangeY),
          annotations: getAnnotations(dataPoints),
        }}
        config={CONFIG}
        onRelayout={handleRelayout}
      />
    </div>
  )
}
