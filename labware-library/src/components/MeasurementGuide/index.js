// @flow
import * as React from 'react'
import {
  getFootprintDiagram,
  getSpacingDiagram,
  getMeasurementDiagram,
} from './diagram-data'
import type { DiagramProps } from './diagram-data'

export function MeasurementGuide(props: DiagramProps) {
  const { category, guideType } = props
  if (!category || !guideType) return null
  let diagrams
  switch (guideType) {
    case 'footprint':
      diagrams = getFootprintDiagram(props)
      break
    case 'spacing':
      diagrams = getSpacingDiagram(props)
      break
    case 'measurements':
      diagrams = getMeasurementDiagram(props)
      break
  }

  return (
    <>
      {diagrams &&
        diagrams.map((src, index) => {
          return <img src={src} key={index} />
        })}
    </>
  )
}

export type { DiagramProps }
