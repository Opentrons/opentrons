// @flow
import * as React from 'react'
import { getDiagramSrc } from './diagram-data'
import type { DiagramProps } from './diagram-data'

export function MeasurementGuide(props: DiagramProps) {
  const { category, guideType } = props
  if (!category || !guideType) return null
  const diagrams = getDiagramSrc(props)

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
