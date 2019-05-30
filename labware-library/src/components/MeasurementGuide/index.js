// @flow
import * as React from 'react'
import cx from 'classnames'
import styles from './styles.css'
import { getDiagramSrc } from './diagram-data'
import type { DiagramProps } from './diagram-data'

export function MeasurementGuide(props: DiagramProps) {
  const { category, guideType, guideVisible } = props
  if (!category || !guideType) return null
  const diagrams = getDiagramSrc(props)
  const className = cx(styles.measurement_guide, {
    [styles.open]: guideVisible,
  })
  return (
    <div className={className}>
      {diagrams &&
        diagrams.map((src, index) => {
          return <img src={src} key={index} />
        })}
    </div>
  )
}

export type { DiagramProps }
