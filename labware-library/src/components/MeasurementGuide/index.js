// @ flow
import * as React from 'react'
import cx from 'classnames'
import styles from './styles.css'

export type GuideProps = {|
  category?: string,
  guideType?: string,
  guideVisible?: boolean,
|}

export function MeasurementGuide(props: GuideProps) {
  const { category, guideType, guideVisible } = props
  if (!category || !guideType) return null
  const diagrams = getDiagramSrc(props)
  const className = cx(styles.measurement_guide, {
    [styles.open]: guideVisible,
  })
  return (
    <div className={className}>
      {guideType} {category}
      {diagrams &&
        diagrams.map((src, index) => {
          return <img src={src} key={index} />
        })}
    </div>
  )
}

const DIAGRAMS: { [guideType]: { [category]: Array<?string> } } = {
  footprint: {
    wellPlate: [
      require('./images/footprint@3x.png'),
      require('./images/height-plate-and-reservoir@3x.png'),
    ],
    tipRack: [
      require('./images/footprint@3x.png'),
      require('./images/height-tip-rack@3x.png'),
    ],
    tubeRack: [
      require('./images/footprint@3x.png'),
      require('./images/height-tube-rack@3x.png'),
    ],
    trough: [
      require('./images/footprint@3x.png'),
      require('./images/height-plate-and-reservoir@3x.png'),
    ],
  },
}

type DiagramProps = {
  category: string,
  guideType: string,
}

export function getDiagramSrc(props: DiagramProps): string {
  const { category, guideType } = props

  return DIAGRAMS[guideType][category]
}
